'use client'

import { Badge, Box, Button, Flex, Grid, Stack, Text } from '@chakra-ui/react'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, PublicKey, Transaction } from '@solana/web3.js'
import { useRouter } from 'next/navigation'
import { type JSX, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { formatDuration, parseJson, resolveProgress, sanitizeName, splitTitle } from '@/features'
import { useGameStore } from '@/features/character/stores/useGameStore'
import type { QuestReward, RecipeInput, RecipeOutput } from '@/lib'
import {
  calculateQuestEnergyCost,
  calculateRecipeEnergyCost,
  claimQuestIx,
  claimRecipeIx,
  findCharacterPda,
  startQuestIx,
  startRecipeIx
} from '@/lib'
import { useCodexStore } from '@/stores'
import { CurrentTaskCard } from './CurrentTaskCard'
import { ModuleLoader } from './ModuleLoader'
import { ResourceBadges, RewardBadges, StatRequirementBadges } from './TaskBadges'

type QuestState = {
  quest_id?: number
  questId?: number
  started_at?: string | number
  startedAt?: string | number
  ready_at?: string | number
  readyAt?: string | number
  rewards?: unknown
}

type RecipeState = {
  recipe_id?: number
  recipeId?: number
  started_at?: string | number
  startedAt?: string | number
  ready_at?: string | number
  readyAt?: string | number
  output?: unknown
}

export type ActionsSwitcherProps = {
  quests: {
    id: number
    name: string
    levelRequired: number
    energyCost: number
    type: string
    rewards?: QuestReward[]
    requirements?: Record<string, number>
    durationSeconds?: number
  }[]
  recipes: {
    id: number
    name: string
    levelRequired: number
    type: string
    energyCost: number
    input?: RecipeInput
    output?: RecipeOutput | RecipeOutput[]
    durationSeconds?: number
  }[]
  characterLevel: number
  characterEnergy: number
  characterStats: Record<string, number>
  civilization: string
  civilizationCharacterId: number
  currentQuest: QuestState | null
  currentRecipe: RecipeState | null
}

const VIEWS = ['quests', 'craft', 'forge'] as const
const QUEST_TYPE_COPY: Record<string, string> = {
  Job: 'Reliable contracts that bring home gold, ensuring you can pay forge fees, buy recipes, and keep gear in shape.',
  Farm: 'Material-focused outings that scoop up the hides, ores, and reagents needed for forge projects and weapon crafts.',
  Raid: 'High-intensity excursions designed primarily for experience gain, pushing your character toward the next tier.'
}

const CIV_INDEX: Record<string, number> = {
  Ard: 0,
  Hartenn: 1,
  Ikarans: 2,
  Zhand: 3,
  Shinkari: 4,
  Tarki: 5
}

export function ActionsSwitcher({
  quests,
  recipes,
  characterLevel,
  characterEnergy,
  characterStats,
  civilization,
  civilizationCharacterId,
  currentQuest,
  currentRecipe
}: ActionsSwitcherProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const router = useRouter()
  const [view, setView] = useState<(typeof VIEWS)[number]>('quests')
  const [submitting, setSubmitting] = useState<number | string | null>(null)
  const isUserRejection = useCallback((err: unknown) => err instanceof Error && /user rejected/i.test(err.message), [])
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))

  const { inventory, refreshInventory } = useGameStore()
  const codexResourceMints = useCodexStore((state) => state.codex?.resourceMints || [])
  const codex = useCodexStore((state) => state.codex)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const characterCoreStats = useMemo(
    () => ({
      might: Number.isFinite(characterStats.might) ? characterStats.might : 0,
      speed: Number.isFinite(characterStats.speed) ? characterStats.speed : 0,
      intellect: Number.isFinite(characterStats.intellect) ? characterStats.intellect : 0
    }),
    [characterStats]
  )

  const questOptions = useMemo(() => {
    if (quests.length) return quests
    if (!codex) return []
    return codex.quests
      .filter((item) => (item.levelRequired ?? 0) <= characterLevel)
      .sort((a, b) => a.levelRequired - b.levelRequired || a.id - b.id)
      .map((q) => ({
        id: q.id,
        name: q.displayName,
        levelRequired: q.levelRequired,
        energyCost: calculateQuestEnergyCost(q, characterLevel, characterCoreStats),
        type: q.questType,
        rewards: q.rewards,
        requirements: q.minimumStats,
        durationSeconds: q.cooldownSeconds
      }))
  }, [quests, codex, characterLevel, characterCoreStats])

  const recipeOptions = useMemo(() => {
    if (recipes.length) return recipes
    if (!codex) return []
    return codex.recipes
      .filter((item) => (item.levelRequired ?? 0) <= characterLevel)
      .sort((a, b) => a.levelRequired - b.levelRequired || a.id - b.id)
      .map((r) => ({
        id: r.id,
        name: r.displayName,
        levelRequired: r.levelRequired,
        type: r.recipeType,
        energyCost: calculateRecipeEnergyCost(r, characterLevel, characterCoreStats),
        input: r.input,
        output: r.output,
        durationSeconds: r.cooldownSeconds
      }))
  }, [recipes, codex, characterLevel, characterCoreStats])

  const validateQuest = (quest: {
    levelRequired: number
    energyCost: number
    requirements?: Record<string, number>
  }) => {
    const issues: string[] = []

    // Check level
    if (characterLevel < quest.levelRequired) {
      issues.push(`Requires Level ${quest.levelRequired}`)
    }

    // Check energy
    if (characterEnergy < quest.energyCost) {
      issues.push(`Need ${quest.energyCost - characterEnergy} more Energy`)
    }

    // Check minimum stats
    if (quest.requirements) {
      const parsed = parseJson(quest.requirements)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [stat, required] of Object.entries(parsed)) {
          const current = characterStats[stat] || 0
          const requiredNum = Number(required)
          if (Number.isFinite(requiredNum) && current < requiredNum) {
            const statName = stat.charAt(0).toUpperCase() + stat.slice(1)
            issues.push(`Need ${requiredNum - current} more ${statName}`)
          }
        }
      }
    }

    return { canPerform: issues.length === 0, issues }
  }

  const validateRecipe = (recipe: { levelRequired: number; energyCost: number; input?: RecipeInput }) => {
    const issues: string[] = []

    // Check level
    if (characterLevel < recipe.levelRequired) {
      issues.push(`Requires Level ${recipe.levelRequired}`)
    }

    // Check energy
    if (characterEnergy < recipe.energyCost) {
      issues.push(`Need ${recipe.energyCost - characterEnergy} more Energy`)
    }

    // Check resources
    if (recipe.input) {
      const parsed = parseJson(recipe.input)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>

        // Check craft materials and gold
        if (obj.type === 'Craft' && Array.isArray(obj.materials)) {
          const materials = obj.materials as Array<Record<string, unknown>>
          for (const material of materials) {
            const resourceName = String(material.resource ?? material.raw_material ?? '')
            const requiredAmount = Number(material.amount ?? 0)
            const inventoryItem = inventory.find((item) => item.resource === resourceName)
            const currentAmount = inventoryItem?.amount ?? 0

            if (currentAmount < requiredAmount) {
              const displayName = sanitizeName(resourceName)
              issues.push(`Need ${requiredAmount - currentAmount} more ${displayName}`)
            }
          }

          // Check gold amount
          if (obj.gold_amount) {
            const requiredGold = Number(obj.gold_amount)
            const goldItem = inventory.find((item) => item.resource === 'Gold' || item.displayName === 'Gold')
            const currentGold = goldItem?.amount ?? 0

            if (currentGold < requiredGold) {
              issues.push(`Need ${requiredGold - currentGold} more Gold`)
            }
          }
        }

        // Check forge materials
        if (obj.type === 'Forge') {
          const resourceName = String(obj.raw_material ?? '')
          const requiredAmount = Number(obj.amount ?? 0)
          const inventoryItem = inventory.find((item) => item.resource === resourceName)
          const currentAmount = inventoryItem?.amount ?? 0

          if (currentAmount < requiredAmount) {
            const displayName = sanitizeName(resourceName)
            issues.push(`Need ${requiredAmount - currentAmount} more ${displayName}`)
          }
        }
      }
    }

    return { canPerform: issues.length === 0, issues }
  }

  const handleStartQuest = useCallback(
    async (questId: number) => {
      if (!publicKey || !signTransaction) return

      try {
        setSubmitting(questId)
        const civIndex = CIV_INDEX[civilization] ?? 0
        const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

        const ix = startQuestIx(
          { civilization: civIndex, characterId: civilizationCharacterId, questId },
          { character: characterPda, authority: publicKey }
        )

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        const computeIxs = [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
        ]

        const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...computeIxs, ix)

        const signed = await signTransaction(tx)
        const sig = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })

        startTransition(async () => {
          await Promise.all([refreshInventory(connection, publicKey), router.refresh()])
        })
      } catch (error) {
        console.error('Failed to start quest:', error)
        alert(`Failed to start quest: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setSubmitting(null)
      }
    },
    [publicKey, signTransaction, civilization, civilizationCharacterId, connection, router, refreshInventory]
  )

  const handleStartRecipe = useCallback(
    async (recipeId: number) => {
      if (!publicKey || !signTransaction) return

      try {
        setSubmitting(recipeId)
        const civIndex = CIV_INDEX[civilization] ?? 0
        const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

        // Build remaining accounts for input materials
        const recipeMeta = recipeOptions.find((r) => r.id === recipeId)
        const input = recipeMeta?.input
        const remainingAccounts: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[] = []

        if (input && typeof input === 'object') {
          const inputObj = parseJson(input) as Record<string, unknown>

          // Handle Craft recipes with materials array
          if (inputObj.type === 'Craft' && Array.isArray(inputObj.materials)) {
            const materials = inputObj.materials as Array<Record<string, unknown>>
            for (const material of materials) {
              const resourceName = String(material.resource ?? material.raw_material ?? '')
              if (resourceName) {
                const resourceMint = codexResourceMints.find((rm) => rm.resource === resourceName)
                if (resourceMint?.mint) {
                  const mintPubkey = new PublicKey(resourceMint.mint)
                  const userAta = getAssociatedTokenAddressSync(mintPubkey, publicKey)
                  remainingAccounts.push(
                    { pubkey: mintPubkey, isWritable: true, isSigner: false },
                    { pubkey: userAta, isWritable: true, isSigner: false }
                  )
                }
              }
            }

            // Handle gold if required
            if (inputObj.gold_amount) {
              const goldMint = codexResourceMints.find((rm) => rm.resource === 'Gold' || rm.displayName === 'Gold')
              if (goldMint?.mint) {
                const mintPubkey = new PublicKey(goldMint.mint)
                const userAta = getAssociatedTokenAddressSync(mintPubkey, publicKey)
                remainingAccounts.push(
                  { pubkey: mintPubkey, isWritable: true, isSigner: false },
                  { pubkey: userAta, isWritable: true, isSigner: false }
                )
              }
            }
          }

          // Handle Forge recipes with raw_material
          if (inputObj.type === 'Forge' && inputObj.raw_material) {
            const resourceName = String(inputObj.raw_material)
            const resourceMint = codexResourceMints.find((rm) => rm.resource === resourceName)
            if (resourceMint?.mint) {
              const mintPubkey = new PublicKey(resourceMint.mint)
              const userAta = getAssociatedTokenAddressSync(mintPubkey, publicKey)
              remainingAccounts.push(
                { pubkey: mintPubkey, isWritable: true, isSigner: false },
                { pubkey: userAta, isWritable: true, isSigner: false }
              )
            }
          }
        }

        const ix = startRecipeIx(
          { civilization: civIndex, characterId: civilizationCharacterId, recipeId },
          { character: characterPda, authority: publicKey, remainingAccounts }
        )

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        const computeIxs = [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
        ]

        const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...computeIxs, ix)

        const signed = await signTransaction(tx)
        const sig = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })

        startTransition(async () => {
          await Promise.all([refreshInventory(connection, publicKey), router.refresh()])
        })
      } catch (error) {
        console.error('Failed to start recipe:', error)
        alert(`Failed to start recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setSubmitting(null)
      }
    },
    [
      publicKey,
      signTransaction,
      civilization,
      civilizationCharacterId,
      connection,
      recipeOptions,
      router,
      refreshInventory,
      codexResourceMints.find
    ]
  )

  const handleClaimQuest = useCallback(async () => {
    if (!publicKey || !signTransaction || !currentQuest) return

    try {
      setSubmitting('quest-claim')
      const questId = Number(currentQuest.quest_id ?? currentQuest.questId ?? NaN)
      const civIndex = CIV_INDEX[civilization] ?? 0
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      // Build remaining accounts for resource rewards
      const questMeta = questOptions.find((q) => q.id === questId)
      const rewards = questMeta?.rewards ?? []
      const remainingAccounts: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[] = []

      if (Array.isArray(rewards)) {
        for (const reward of rewards) {
          if (reward && typeof reward === 'object' && 'resource' in reward && reward.resource) {
            const resourceMint = codexResourceMints.find((rm) => rm.resource === reward.resource)
            if (resourceMint?.mint) {
              const mintPubkey = new PublicKey(resourceMint.mint)
              const userAta = getAssociatedTokenAddressSync(mintPubkey, publicKey)
              remainingAccounts.push(
                { pubkey: mintPubkey, isWritable: true, isSigner: false },
                { pubkey: userAta, isWritable: true, isSigner: false }
              )
            }
          }
        }
      }

      const ix = claimQuestIx(
        { civilization: civIndex, characterId: civilizationCharacterId, questId },
        { character: characterPda, authority: publicKey, remainingAccounts }
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const computeIxs = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
      ]

      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...computeIxs, ix)

      const signed = await signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })

      startTransition(async () => {
        await Promise.all([refreshInventory(connection, publicKey), router.refresh()])
      })
    } catch (error) {
      if (isUserRejection(error)) {
        setSubmitting(null)
        return
      }
      console.error('Failed to claim quest:', error)
      alert(`Failed to claim quest: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSubmitting(null)
    }
  }, [
    publicKey,
    signTransaction,
    currentQuest,
    civilization,
    civilizationCharacterId,
    connection,
    isUserRejection,
    router,
    questOptions,
    refreshInventory,
    codexResourceMints.find
  ])

  const handleClaimRecipe = useCallback(async () => {
    if (!publicKey || !signTransaction || !currentRecipe) return

    try {
      setSubmitting('recipe-claim')
      const recipeId = Number(currentRecipe.recipe_id ?? currentRecipe.recipeId ?? NaN)
      const civIndex = CIV_INDEX[civilization] ?? 0
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      // Build remaining accounts for resource output
      const recipeMeta = recipeOptions.find((r) => r.id === recipeId)
      const output = recipeMeta?.output
      const remainingAccounts: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[] = []

      const outputs = Array.isArray(output) ? output : output ? [output] : []
      for (const item of outputs) {
        if (!item || typeof item !== 'object') continue
        const resourceMint = codexResourceMints.find(
          (rm) => rm.resource === item.resource || rm.resourceId === item.resource_id
        )
        if (resourceMint?.mint) {
          const mintPubkey = new PublicKey(resourceMint.mint)
          const userAta = getAssociatedTokenAddressSync(mintPubkey, publicKey)
          remainingAccounts.push(
            { pubkey: mintPubkey, isWritable: true, isSigner: false },
            { pubkey: userAta, isWritable: true, isSigner: false }
          )
        }
      }

      const ix = claimRecipeIx(
        { civilization: civIndex, characterId: civilizationCharacterId, recipeId },
        { character: characterPda, authority: publicKey, remainingAccounts }
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const computeIxs = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
      ]

      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...computeIxs, ix)

      const signed = await signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })

      startTransition(async () => {
        await Promise.all([refreshInventory(connection, publicKey), router.refresh()])
      })
    } catch (error) {
      if (isUserRejection(error)) {
        setSubmitting(null)
        return
      }
      console.error('Failed to claim recipe:', error)
      alert(`Failed to claim recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSubmitting(null)
    }
  }, [
    publicKey,
    signTransaction,
    currentRecipe,
    civilization,
    civilizationCharacterId,
    connection,
    isUserRejection,
    router,
    recipeOptions,
    refreshInventory,
    codexResourceMints.find
  ])

  useEffect(() => {
    if (!isPending) {
      setSubmitting(null)
    }
  }, [isPending])

  const questProgress = resolveProgress(currentQuest, currentTime)
  const recipeProgress = resolveProgress(currentRecipe, currentTime)

  const goPrev = useCallback(() => {
    setView((prev) => {
      const idx = VIEWS.indexOf(prev)
      const nextIdx = (idx - 1 + VIEWS.length) % VIEWS.length
      return VIEWS[nextIdx]
    })
  }, [])

  const goNext = useCallback(() => {
    setView((prev) => {
      const idx = VIEWS.indexOf(prev)
      const nextIdx = (idx + 1) % VIEWS.length
      return VIEWS[nextIdx]
    })
  }, [])

  const isQuests = view === 'quests'
  const isCraft = view === 'craft'
  const headerItem = (label: string, active: boolean) => (
    <Text
      cursor="pointer"
      color={active ? 'white' : 'gray.500'}
      fontWeight={active ? '800' : '700'}
      onClick={() => setView(label.toLowerCase() as (typeof VIEWS)[number])}
    >
      {label}
    </Text>
  )

  const questList = questOptions.map((quest) => {
    const validation = validateQuest(quest)
    return (
      <Box
        key={quest.id}
        border="1px solid rgba(255,255,255,0.1)"
        borderRadius="md"
        padding={4}
        bg="rgba(255,255,255,0.02)"
        _hover={{ bg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.2)' }}
        transition="all 0.2s"
        width="full"
      >
        <Stack gap={3}>
          <Text color="white" fontWeight="800" fontSize="md">
            {quest.name}
          </Text>

          <Box>
            <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
              BASE REQUIREMENTS
            </Text>
            <Flex gap={2} flexWrap="wrap" alignItems="center">
              <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5}>
                Level {quest.levelRequired}
              </Badge>
              <Badge colorScheme="yellow" fontSize="xs" px={2} py={0.5}>
                {quest.energyCost} Energy
              </Badge>
              {quest.durationSeconds && quest.durationSeconds > 0 ? (
                <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5}>
                  Time {formatDuration(Math.round(quest.durationSeconds))}
                </Badge>
              ) : null}
            </Flex>
          </Box>

          <Box>
            <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
              MINIMUM STATS
            </Text>
            <StatRequirementBadges value={quest.requirements} />
          </Box>

          <Box>
            <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
              REWARDS
            </Text>
            <RewardBadges value={quest.rewards} />
          </Box>

          {!validation.canPerform && validation.issues.length > 0 && (
            <Box border="1px solid rgba(239, 68, 68, 0.3)" borderRadius="md" padding={3} bg="rgba(239, 68, 68, 0.08)">
              <Text color="red.400" fontSize="xs" fontWeight="600" mb={1.5}>
                REQUIREMENTS NOT MET
              </Text>
              <Flex gap={1.5} flexWrap="wrap">
                {validation.issues.map((issue, idx) => (
                  <Badge key={idx} colorScheme="red" fontSize="xs" px={2} py={0.5}>
                    {issue}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          <Button
            size="sm"
            alignSelf="flex-end"
            background="custom-blue"
            color="black"
            fontWeight="700"
            _hover={{ bg: 'white', color: 'black' }}
            disabled={!validation.canPerform || submitting === quest.id || isPending}
            opacity={validation.canPerform && submitting !== quest.id && !isPending ? 1 : 0.5}
            cursor={validation.canPerform && submitting !== quest.id && !isPending ? 'pointer' : 'not-allowed'}
            onClick={() => handleStartQuest(quest.id)}
          >
            {submitting === quest.id
              ? 'Submitting...'
              : isPending && submitting === quest.id
                ? 'Refreshing...'
                : 'Start quest'}
          </Button>
        </Stack>
      </Box>
    )
  })
  const cardsForType = (needle: string) =>
    questOptions
      .map((quest, idx) => ((quest.type ?? '').toLowerCase().includes(needle) ? questList[idx] : null))
      .filter(Boolean) as JSX.Element[]
  const questSections = [
    { title: 'Jobs', copy: QUEST_TYPE_COPY.Job, items: cardsForType('job') },
    { title: 'Farms', copy: QUEST_TYPE_COPY.Farm, items: cardsForType('farm') },
    { title: 'Raids', copy: QUEST_TYPE_COPY.Raid, items: cardsForType('raid') }
  ].filter((section) => section.items.length)

  const craftList = recipeOptions
    .filter((recipe) => (recipe.type ?? '').toLowerCase().includes('craft'))
    .map((recipe) => {
      const validation = validateRecipe(recipe)
      return (
        <Box
          key={recipe.id}
          border="1px solid rgba(255,255,255,0.1)"
          borderRadius="md"
          padding={4}
          bg="rgba(255,255,255,0.02)"
          _hover={{ bg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.2)' }}
          transition="all 0.2s"
          width="full"
        >
          <Stack gap={3}>
            <Text color="white" fontWeight="800" fontSize="md">
              {sanitizeName(recipe.name)}
            </Text>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                BASE REQUIREMENTS
              </Text>
              <Flex gap={2} flexWrap="wrap" alignItems="center">
                <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5}>
                  Level {recipe.levelRequired}
                </Badge>
                <Badge colorScheme="yellow" fontSize="xs" px={2} py={0.5}>
                  {recipe.energyCost} Energy
                </Badge>
                {recipe.durationSeconds && recipe.durationSeconds > 0 ? (
                  <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5}>
                    Time {formatDuration(Math.round(recipe.durationSeconds))}
                  </Badge>
                ) : null}
              </Flex>
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                REQUIRED RESOURCES
              </Text>
              <ResourceBadges value={recipe.input} type="input" />
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                PRODUCES
              </Text>
              <ResourceBadges value={recipe.output} type="output" />
            </Box>

            {!validation.canPerform && validation.issues.length > 0 && (
              <Box border="1px solid rgba(239, 68, 68, 0.3)" borderRadius="md" padding={3} bg="rgba(239, 68, 68, 0.08)">
                <Text color="red.400" fontSize="xs" fontWeight="600" mb={1.5}>
                  REQUIREMENTS NOT MET
                </Text>
                <Flex gap={1.5} flexWrap="wrap">
                  {validation.issues.map((issue, idx) => (
                    <Badge key={idx} colorScheme="red" fontSize="xs" px={2} py={0.5}>
                      {issue}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}

            <Button
              size="sm"
              alignSelf="flex-end"
              background="custom-blue"
              color="black"
              fontWeight="700"
              _hover={{ bg: 'white', color: 'black' }}
              disabled={!validation.canPerform || submitting === recipe.id || isPending}
              opacity={validation.canPerform && submitting !== recipe.id && !isPending ? 1 : 0.5}
              cursor={validation.canPerform && submitting !== recipe.id && !isPending ? 'pointer' : 'not-allowed'}
              onClick={() => handleStartRecipe(recipe.id)}
            >
              {submitting === recipe.id
                ? 'Submitting...'
                : isPending && submitting === recipe.id
                  ? 'Refreshing...'
                  : 'Start craft'}
            </Button>
          </Stack>
        </Box>
      )
    })

  const forgeList = recipeOptions
    .filter((recipe) => (recipe.type ?? '').toLowerCase().includes('forge'))
    .map((recipe) => {
      const validation = validateRecipe(recipe)
      return (
        <Box
          key={recipe.id}
          border="1px solid rgba(255,255,255,0.1)"
          borderRadius="md"
          padding={4}
          bg="rgba(255,255,255,0.02)"
          _hover={{ bg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.2)' }}
          transition="all 0.2s"
          width="full"
        >
          <Stack gap={3}>
            <Text color="white" fontWeight="800" fontSize="md">
              {sanitizeName(recipe.name)}
            </Text>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                BASE REQUIREMENTS
              </Text>
              <Flex gap={2} flexWrap="wrap" alignItems="center">
                <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5}>
                  Level {recipe.levelRequired}
                </Badge>
                <Badge colorScheme="yellow" fontSize="xs" px={2} py={0.5}>
                  {recipe.energyCost} Energy
                </Badge>
                {recipe.durationSeconds && recipe.durationSeconds > 0 ? (
                  <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5}>
                    Time {formatDuration(Math.round(recipe.durationSeconds))}
                  </Badge>
                ) : null}
              </Flex>
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                REQUIRED RESOURCES
              </Text>
              <ResourceBadges value={recipe.input} type="input" />
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                PRODUCES
              </Text>
              <ResourceBadges value={recipe.output} type="output" />
            </Box>

            {!validation.canPerform && validation.issues.length > 0 && (
              <Box border="1px solid rgba(239, 68, 68, 0.3)" borderRadius="md" padding={3} bg="rgba(239, 68, 68, 0.08)">
                <Text color="red.400" fontSize="xs" fontWeight="600" mb={1.5}>
                  REQUIREMENTS NOT MET
                </Text>
                <Flex gap={1.5} flexWrap="wrap">
                  {validation.issues.map((issue, idx) => (
                    <Badge key={idx} colorScheme="red" fontSize="xs" px={2} py={0.5}>
                      {issue}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}

            <Button
              size="sm"
              alignSelf="flex-end"
              background="custom-blue"
              color="black"
              fontWeight="700"
              _hover={{ bg: 'white', color: 'black' }}
              disabled={!validation.canPerform || submitting === recipe.id || isPending}
              opacity={validation.canPerform && submitting !== recipe.id && !isPending ? 1 : 0.5}
              cursor={validation.canPerform && submitting !== recipe.id && !isPending ? 'pointer' : 'not-allowed'}
              onClick={() => handleStartRecipe(recipe.id)}
            >
              {submitting === recipe.id
                ? 'Submitting...'
                : isPending && submitting === recipe.id
                  ? 'Refreshing...'
                  : 'Start forge'}
            </Button>
          </Stack>
        </Box>
      )
    })

  const renderCurrentTask = () => {
    if (isQuests && currentQuest) {
      const questId = Number(currentQuest.quest_id ?? currentQuest.questId ?? NaN)
      const questMeta = questOptions.find((q) => q.id === questId)
      const questName = questMeta?.name ?? (Number.isFinite(questId) ? `Quest #${questId}` : 'Quest')
      const nameParts = splitTitle(questName)
      const progress = questProgress
      const rewards = parseJson(questMeta?.rewards ?? currentQuest.rewards)

      return (
        <CurrentTaskCard
          titleLines={nameParts.map((part) => sanitizeName(part))}
          primaryLabel="REWARDS"
          primaryContent={<RewardBadges value={rewards as QuestReward[]} />}
          progress={progress}
          onClaim={handleClaimQuest}
          claimLabel="Claim quest"
          submitting={submitting === 'quest-claim' || (isPending && submitting === 'quest-claim')}
        />
      )
    }

    if ((isCraft || view === 'forge') && currentRecipe) {
      const recipeId = Number(currentRecipe.recipe_id ?? currentRecipe.recipeId ?? NaN)
      const recipeMeta = recipeOptions.find((r) => r.id === recipeId)
      const recipeName = recipeMeta?.name ?? (Number.isFinite(recipeId) ? `Recipe #${recipeId}` : 'Recipe')
      const nameParts = splitTitle(recipeName)
      const progress = recipeProgress ?? resolveProgress(currentRecipe, currentTime)

      return (
        <CurrentTaskCard
          titleLines={nameParts.map((part) => sanitizeName(part))}
          primaryLabel="PRODUCES"
          primaryContent={<ResourceBadges value={recipeMeta?.output ?? currentRecipe.output} type="output" />}
          progress={progress}
          onClaim={handleClaimRecipe}
          claimLabel="Claim craft"
          submitting={submitting === 'recipe-claim' || (isPending && submitting === 'recipe-claim')}
        />
      )
    }

    return null
  }

  const currentTaskView = renderCurrentTask()

  let content: JSX.Element | JSX.Element[] | null = currentTaskView

  if (!content) {
    if (isQuests) {
      content = questSections.length
        ? questSections.map((section) => (
            <Stack key={section.title} gap={2} border="1px solid rgba(255,255,255,0.1)" borderRadius="md" padding={3}>
              <Text color="white" fontWeight="800">
                {section.title}
              </Text>
              <Text color="gray.400" fontSize="sm">
                {section.copy}
              </Text>
              <Stack gap={2}>{section.items}</Stack>
            </Stack>
          ))
        : [<Text key="no-quests">None</Text>]
    } else if (isCraft) {
      content = craftList.length ? craftList : [<Text key="no-craft">None</Text>]
    } else if (view === 'forge') {
      content = forgeList.length ? forgeList : [<Text key="no-forge">None</Text>]
    }
  }

  const hasContent = content !== null && (Array.isArray(content) ? content.length > 0 : true)
  const isClaimSubmitting = submitting === 'quest-claim' || submitting === 'recipe-claim'

  return (
    <Box position="relative">
      <ModuleLoader loading={Boolean(submitting) && !isClaimSubmitting} label="Submitting transaction..." />
      <Stack gap={4} width="full">
        <Grid templateColumns="auto minmax(0, 1fr) auto" alignItems="center" gap={{ base: 2, md: 0 }} width="full">
          <Box
            as="button"
            aria-label="Previous view"
            background="transparent"
            _hover={{ opacity: 0.7 }}
            onClick={goPrev}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
              <title>ChevronLeft</title>
              <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Stack
            direction="row"
            align="center"
            justify="center"
            gap={2}
            flex="1 1 auto"
            flexWrap={{ base: 'wrap', sm: 'nowrap' }}
            color="white"
            fontWeight="700"
            fontSize={{ base: 'sm', md: 'md' }}
            textAlign="center"
          >
            {headerItem('Quests', isQuests)}
            <Text color="gray.500">|</Text>
            {headerItem('Craft', isCraft)}
            <Text color="gray.500">|</Text>
            {headerItem('Forge', view === 'forge')}
          </Stack>
          <Box as="button" aria-label="Next view" background="transparent" _hover={{ opacity: 0.7 }} onClick={goNext}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
              <title>ChevronRight</title>
              <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
        </Grid>

        <Stack gap={3} color="gray.500" fontSize="sm" width="full">
          {hasContent ? content : <Text>None</Text>}
        </Stack>
      </Stack>
    </Box>
  )
}
