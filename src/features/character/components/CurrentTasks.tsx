'use client'

import { Accordion, Text } from '@chakra-ui/react'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, PublicKey, Transaction } from '@solana/web3.js'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { resolveProgress, sanitizeName, splitTitle, useGameStore } from '@/features'
import type { CodexQuest, CodexRecipe } from '@/lib'
import { claimQuestIx, claimRecipeIx, findCharacterPda } from '@/lib'
import { useCodexStore } from '@/stores'
import { CurrentTaskCard } from './CurrentTaskCard'
import { ResourceBadges, RewardBadges } from './TaskBadges'

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

type CurrentTasksProps = {
  questState: QuestState | null
  recipeState: RecipeState | null
  codexQuests: CodexQuest[]
  codexRecipes: CodexRecipe[]
  civilization: string
  civilizationCharacterId: number
}

const CIV_INDEX: Record<string, number> = {
  Ard: 0,
  Hartenn: 1,
  Ikarans: 2,
  Zhand: 3,
  Shinkari: 4,
  Tarki: 5
}

export function CurrentTasks({ questState, recipeState, civilization, civilizationCharacterId }: CurrentTasksProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const router = useRouter()
  const refreshInventory = useGameStore((state) => state.refreshInventory)
  const codexResourceMints = useCodexStore((state) => state.codex?.resourceMints || [])
  const codex = useCodexStore((state) => state.codex)
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))
  const [submitting, setSubmitting] = useState<'quest' | 'recipe' | null>(null)
  const isUserRejection = useCallback((err: unknown) => err instanceof Error && /user rejected/i.test(err.message), [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const effectiveQuests = useMemo(() => {
    return codex?.quests ?? []
  }, [codex])

  const effectiveRecipes = useMemo(() => {
    return codex?.recipes ?? []
  }, [codex])

  const questProgress = resolveProgress(questState, currentTime)
  const recipeProgress = resolveProgress(recipeState, currentTime)

  const handleClaimQuest = useCallback(async () => {
    if (!publicKey || !signTransaction || !questState) return

    try {
      setSubmitting('quest')
      const questId = Number(questState.quest_id ?? questState.questId ?? NaN)
      const civIndex = CIV_INDEX[civilization] ?? 0
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      // Build remaining accounts for resource rewards
      const questMeta = effectiveQuests.find((q) => Number(q.id) === questId)
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

      await Promise.all([refreshInventory(connection, publicKey), router.refresh()])
    } catch (error) {
      if (isUserRejection(error)) {
        return
      }
      console.error('Failed to claim quest:', error)
      alert(`Failed to claim quest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(null)
    }
  }, [
    publicKey,
    signTransaction,
    questState,
    civilization,
    civilizationCharacterId,
    connection,
    router,
    effectiveQuests,
    codexResourceMints,
    isUserRejection,
    refreshInventory
  ])

  const handleClaimRecipe = useCallback(async () => {
    if (!publicKey || !signTransaction || !recipeState) return

    try {
      setSubmitting('recipe')
      const recipeId = Number(recipeState.recipe_id ?? recipeState.recipeId ?? NaN)
      const civIndex = CIV_INDEX[civilization] ?? 0
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      // Build remaining accounts for resource output
      const recipeMeta = effectiveRecipes.find((r) => Number(r.id) === recipeId)
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

      await Promise.all([refreshInventory(connection, publicKey), router.refresh()])
    } catch (error) {
      if (isUserRejection(error)) {
        return
      }
      console.error('Failed to claim recipe:', error)
      alert(`Failed to claim recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(null)
    }
  }, [
    publicKey,
    signTransaction,
    recipeState,
    civilization,
    civilizationCharacterId,
    connection,
    router,
    effectiveRecipes,
    codexResourceMints,
    isUserRejection,
    refreshInventory
  ])

  return (
    <>
      <Accordion.Item value="current-quest">
        <Accordion.ItemTrigger
          paddingX={3}
          paddingY={2}
          _hover={{ bg: 'rgba(255,255,255,0.08)' }}
          display="flex"
          alignItems="center"
          gap={2}
          color="white"
          fontWeight="700"
          fontSize="md"
        >
          <Text flex="1" textAlign="left">
            Current quest
          </Text>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody paddingX={3} paddingY={3}>
            {questState ? (
              (() => {
                const questId = Number(questState.quest_id ?? questState.questId ?? NaN)
                const questMeta = effectiveQuests.find((q) => Number(q.id) === questId)
                const title = questMeta?.displayName ?? (Number.isFinite(questId) ? `Quest #${questId}` : 'Quest')
                const parts = splitTitle(title).map((line) => sanitizeName(line))
                const rewards = questMeta?.rewards ?? questState.rewards
                return (
                  <CurrentTaskCard
                    titleLines={parts}
                    primaryLabel="REWARDS"
                    primaryContent={<RewardBadges value={rewards} />}
                    progress={questProgress}
                    onClaim={handleClaimQuest}
                    claimLabel="Claim quest"
                    submitting={submitting === 'quest'}
                  />
                )
              })()
            ) : (
              <Text color="gray.500" fontSize="sm">
                None
              </Text>
            )}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>

      <Accordion.Item value="current-recipe">
        <Accordion.ItemTrigger
          paddingX={3}
          paddingY={2}
          _hover={{ bg: 'rgba(255,255,255,0.08)' }}
          display="flex"
          alignItems="center"
          gap={2}
          color="white"
          fontWeight="700"
          fontSize="md"
        >
          <Text flex="1" textAlign="left">
            Current craft
          </Text>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody paddingX={3} paddingY={3}>
            {recipeState ? (
              (() => {
                const recipeId = Number(recipeState.recipe_id ?? recipeState.recipeId ?? NaN)
                const recipeMeta = effectiveRecipes.find((r) => Number(r.id) === recipeId)
                const displayName =
                  recipeMeta?.displayName ?? (Number.isFinite(recipeId) ? `Recipe #${recipeId}` : 'Recipe')
                const parts = splitTitle(sanitizeName(displayName)).map((line) => sanitizeName(line))
                const output = recipeMeta?.output ?? recipeState.output
                return (
                  <CurrentTaskCard
                    titleLines={parts}
                    primaryLabel="PRODUCES"
                    primaryContent={<ResourceBadges value={output} type="output" />}
                    progress={recipeProgress}
                    onClaim={handleClaimRecipe}
                    claimLabel="Claim craft"
                    submitting={submitting === 'recipe'}
                  />
                )
              })()
            ) : (
              <Text color="gray.500" fontSize="sm">
                None
              </Text>
            )}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </>
  )
}
