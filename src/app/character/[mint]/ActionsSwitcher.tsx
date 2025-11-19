'use client'

import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { type JSX, useCallback, useState } from 'react'
import { findCharacterPda, startQuestIx, startRecipeIx } from '@/lib/arising'
import type { QuestReward, RecipeInput, RecipeOutput } from '@/lib/characters'

export type ActionsSwitcherProps = {
  quests: {
    id: number
    name: string
    levelRequired: number
    energyCost: number
    type: string
    rewards?: QuestReward[]
    requirements?: Record<string, number>
  }[]
  recipes: {
    id: number
    name: string
    levelRequired: number
    type: string
    energyCost: number
    input?: RecipeInput
    output?: RecipeOutput
  }[]
  characterLevel: number
  characterEnergy: number
  characterStats: Record<string, number>
  inventory: Array<{
    resource: string
    displayName: string
    mint: string
    amount: number
  }>
  civilization: string
  civilizationCharacterId: number
}

const VIEWS = ['quests', 'craft', 'forge'] as const
const QUEST_TYPE_COPY: Record<string, string> = {
  Job: 'Short tasks that pay out steady resources.',
  Farm: 'Resource-focused runs to gather materials.',
  Raid: 'Harder encounters with higher risk and reward.'
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
  inventory,
  civilization,
  civilizationCharacterId
}: ActionsSwitcherProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [view, setView] = useState<(typeof VIEWS)[number]>('quests')
  const [submitting, setSubmitting] = useState<number | null>(null)

  const parseJson = (value: string | object | null | undefined) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  }

  const sanitizeName = (name: string) => {
    // Convert camelCase or PascalCase to readable text
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim()
  }

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

    // Check stats
    if (quest.requirements) {
      const parsed = parseJson(quest.requirements)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [stat, required] of Object.entries(parsed)) {
          const current = characterStats[stat] || 0
          const requiredNum = Number(required)
          if (current < requiredNum) {
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

        window.location.reload()
      } catch (error) {
        console.error('Failed to start quest:', error)
        alert(`Failed to start quest: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setSubmitting(null)
      }
    },
    [publicKey, signTransaction, civilization, civilizationCharacterId, connection]
  )

  const handleStartRecipe = useCallback(
    async (recipeId: number) => {
      if (!publicKey || !signTransaction) return

      try {
        setSubmitting(recipeId)
        const civIndex = CIV_INDEX[civilization] ?? 0
        const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

        const ix = startRecipeIx(
          { civilization: civIndex, characterId: civilizationCharacterId, recipeId },
          { character: characterPda, authority: publicKey }
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

        window.location.reload()
      } catch (error) {
        console.error('Failed to start recipe:', error)
        alert(`Failed to start recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setSubmitting(null)
      }
    },
    [publicKey, signTransaction, civilization, civilizationCharacterId, connection]
  )

  const renderStatRequirements = (value: Record<string, number> | undefined) => {
    const parsed = parseJson(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>).filter(([, val]) => Number(val) > 0)
      if (!entries.length)
        return (
          <Badge colorScheme="gray" fontSize="xs">
            None
          </Badge>
        )

      return (
        <Flex gap={1.5} flexWrap="wrap">
          {entries.map(([key, val]) => {
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
            return (
              <Badge key={key} colorScheme="purple" fontSize="xs" px={2} py={0.5}>
                {capitalizedKey} {String(val ?? 0)}
              </Badge>
            )
          })}
        </Flex>
      )
    }
    return (
      <Badge colorScheme="gray" fontSize="xs">
        None
      </Badge>
    )
  }

  const renderRewards = (value: QuestReward[] | undefined) => {
    const parsed = parseJson(value)
    if (Array.isArray(parsed)) {
      return (
        <Flex gap={1} flexWrap="wrap">
          {parsed.map((item, idx) => {
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>
              const amount = String(obj.amount ?? '')
              const resource = String(obj.resource ?? obj.type ?? 'Reward')
              return (
                <Badge key={idx} colorScheme="green" fontSize="xs" px={2} py={0.5}>
                  {amount} {resource}
                </Badge>
              )
            }
            return (
              <Badge key={idx} colorScheme="green" fontSize="xs" px={2} py={0.5}>
                {String(item)}
              </Badge>
            )
          })}
        </Flex>
      )
    }
    return (
      <Badge colorScheme="gray" fontSize="xs">
        None
      </Badge>
    )
  }

  const renderResources = (value: RecipeInput | RecipeOutput | undefined, type: 'input' | 'output') => {
    const parsed = parseJson(value)

    if (!parsed || typeof parsed !== 'object') {
      return (
        <Badge colorScheme="gray" fontSize="xs">
          None
        </Badge>
      )
    }

    if (!Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>

      // Handle Craft input format: {type: "Craft", materials: [...], gold_amount: 50}
      if (type === 'input' && obj.type === 'Craft' && Array.isArray(obj.materials)) {
        const materials = obj.materials as Array<Record<string, unknown>>
        const goldAmount = obj.gold_amount

        return (
          <Flex gap={1.5} flexWrap="wrap">
            {materials.map((material, idx) => {
              const amount = String(material.amount ?? '')
              const rawRes = material.resource ?? material.raw_material ?? 'Material'
              const res = sanitizeName(String(rawRes))
              return (
                <Badge key={`mat-${idx}`} colorScheme="orange" fontSize="xs" px={2} py={0.5}>
                  {amount} {res}
                </Badge>
              )
            })}
            {goldAmount ? (
              <Badge colorScheme="yellow" fontSize="xs" px={2} py={0.5}>
                {String(goldAmount)} Gold
              </Badge>
            ) : null}
          </Flex>
        )
      }

      // Handle Forge input format: {type: "Forge", amount: 1, raw_material: "Wood"}
      // Handle output format: {type: "Resource", amount: 1, resource: "Plank"}
      const amount = String(obj.amount ?? '')
      const rawRes =
        obj.resource ?? obj.raw_material ?? obj.material ?? obj.item ?? obj.name ?? obj.displayName ?? 'Item'
      const res = sanitizeName(String(rawRes))
      return (
        <Badge colorScheme={type === 'output' ? 'green' : 'orange'} fontSize="xs" px={2} py={0.5}>
          {amount} {res}
        </Badge>
      )
    }

    // Handle array format (legacy or alternative format)
    return (
      <Flex gap={1.5} flexWrap="wrap">
        {parsed.map((item, idx) => {
          if (item && typeof item === 'object') {
            const itemObj = item as Record<string, unknown>
            const amount = String(itemObj.amount ?? '')
            const rawRes =
              itemObj.resource ??
              itemObj.raw_material ??
              itemObj.material ??
              itemObj.item ??
              itemObj.name ??
              itemObj.displayName ??
              'Item'
            const res = sanitizeName(String(rawRes))
            return (
              <Badge key={idx} colorScheme={type === 'output' ? 'green' : 'orange'} fontSize="xs" px={2} py={0.5}>
                {amount} {res}
              </Badge>
            )
          }
          return (
            <Badge key={idx} colorScheme={type === 'output' ? 'green' : 'orange'} fontSize="xs" px={2} py={0.5}>
              {sanitizeName(String(item))}
            </Badge>
          )
        })}
      </Flex>
    )
  }

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

  const questList = quests.map((quest) => {
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
            </Flex>
          </Box>

          <Box>
            <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
              REQUIRED STATS
            </Text>
            {renderStatRequirements(quest.requirements)}
          </Box>

          <Box>
            <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
              REWARDS
            </Text>
            {renderRewards(quest.rewards)}
          </Box>

          {!validation.canPerform && validation.issues.length > 0 && (
            <Box
              border="1px solid rgba(239, 68, 68, 0.3)"
              borderRadius="md"
              padding={3}
              bg="rgba(239, 68, 68, 0.08)"
            >
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
            disabled={!validation.canPerform || submitting === quest.id}
            opacity={validation.canPerform && submitting !== quest.id ? 1 : 0.5}
            cursor={validation.canPerform && submitting !== quest.id ? 'pointer' : 'not-allowed'}
            onClick={() => handleStartQuest(quest.id)}
          >
            {submitting === quest.id ? 'Submitting...' : 'Start quest'}
          </Button>
        </Stack>
      </Box>
    )
  })
  const cardsForType = (needle: string) =>
    quests
      .map((quest, idx) => ((quest.type ?? '').toLowerCase().includes(needle) ? questList[idx] : null))
      .filter(Boolean) as JSX.Element[]
  const questSections = [
    { title: 'Jobs', copy: QUEST_TYPE_COPY.Job, items: cardsForType('job') },
    { title: 'Farms', copy: QUEST_TYPE_COPY.Farm, items: cardsForType('farm') },
    { title: 'Raids', copy: QUEST_TYPE_COPY.Raid, items: cardsForType('raid') }
  ].filter((section) => section.items.length)

  const craftList = recipes
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
              </Flex>
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                REQUIRED RESOURCES
              </Text>
              {renderResources(recipe.input, 'input')}
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                PRODUCES
              </Text>
              {renderResources(recipe.output, 'output')}
            </Box>

            {!validation.canPerform && validation.issues.length > 0 && (
              <Box
                border="1px solid rgba(239, 68, 68, 0.3)"
                borderRadius="md"
                padding={3}
                bg="rgba(239, 68, 68, 0.08)"
              >
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
              disabled={!validation.canPerform || submitting === recipe.id}
              opacity={validation.canPerform && submitting !== recipe.id ? 1 : 0.5}
              cursor={validation.canPerform && submitting !== recipe.id ? 'pointer' : 'not-allowed'}
              onClick={() => handleStartRecipe(recipe.id)}
            >
              {submitting === recipe.id ? 'Submitting...' : 'Start craft'}
            </Button>
          </Stack>
        </Box>
      )
    })

  const forgeList = recipes
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
              </Flex>
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                REQUIRED RESOURCES
              </Text>
              {renderResources(recipe.input, 'input')}
            </Box>

            <Box>
              <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                PRODUCES
              </Text>
              {renderResources(recipe.output, 'output')}
            </Box>

            {!validation.canPerform && validation.issues.length > 0 && (
              <Box
                border="1px solid rgba(239, 68, 68, 0.3)"
                borderRadius="md"
                padding={3}
                bg="rgba(239, 68, 68, 0.08)"
              >
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
              disabled={!validation.canPerform || submitting === recipe.id}
              opacity={validation.canPerform && submitting !== recipe.id ? 1 : 0.5}
              cursor={validation.canPerform && submitting !== recipe.id ? 'pointer' : 'not-allowed'}
              onClick={() => handleStartRecipe(recipe.id)}
            >
              {submitting === recipe.id ? 'Submitting...' : 'Start forge'}
            </Button>
          </Stack>
        </Box>
      )
    })

  let content: JSX.Element | JSX.Element[] = questSections.length
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

  if (isCraft) content = craftList.length ? craftList : [<Text key="no-craft">None</Text>]
  if (view === 'forge') content = forgeList.length ? forgeList : [<Text key="no-forge">None</Text>]
  const hasContent = Array.isArray(content) ? content.length > 0 : true

  return (
    <Stack gap={4} width="full">
      <Stack direction="row" align="center" justify="space-between">
        <Box as="button" aria-label="Previous view" background="transparent" _hover={{ opacity: 0.7 }} onClick={goPrev}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
            <title>ChevronLeft</title>
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        <Stack direction="row" align="center" gap={3} color="white" fontWeight="700" fontSize="md">
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
      </Stack>

      <Stack gap={3} color="gray.500" fontSize="sm">
        {hasContent ? content : <Text>None</Text>}
      </Stack>
    </Stack>
  )
}
