'use client'

import { Accordion, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'
import { claimQuestIx, claimRecipeIx, findCharacterPda } from '@/lib/arising'
import type { CodexQuest, CodexRecipe } from '@/lib/characters'
import { CurrentTaskCard } from './CurrentTaskCard'
import { RewardBadges, ResourceBadges } from './TaskBadges'
import { resolveProgress, sanitizeName, splitTitle } from './taskUtils'

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

export function CurrentTasks({
  questState,
  recipeState,
  codexQuests,
  codexRecipes,
  civilization,
  civilizationCharacterId
}: CurrentTasksProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))
  const [submitting, setSubmitting] = useState<'quest' | 'recipe' | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const questProgress = resolveProgress(questState, currentTime)
  const recipeProgress = resolveProgress(recipeState, currentTime)

  const handleClaimQuest = useCallback(async () => {
    if (!publicKey || !signTransaction || !questState) return

    try {
      setSubmitting('quest')
      const questId = Number(questState.quest_id ?? questState.questId ?? NaN)
      const civIndex = CIV_INDEX[civilization] ?? 0
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      const ix = claimQuestIx(
        { civilization: civIndex, characterId: civilizationCharacterId, questId },
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

    } catch (error) {
      console.error('Failed to claim quest:', error)
      alert(`Failed to claim quest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(null)
    }
  }, [publicKey, signTransaction, questState, civilization, civilizationCharacterId, connection])

  const handleClaimRecipe = useCallback(async () => {
    if (!publicKey || !signTransaction || !recipeState) return

    try {
      setSubmitting('recipe')
      const recipeId = Number(recipeState.recipe_id ?? recipeState.recipeId ?? NaN)
      const civIndex = CIV_INDEX[civilization] ?? 0
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      const ix = claimRecipeIx(
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

    } catch (error) {
      console.error('Failed to claim recipe:', error)
      alert(`Failed to claim recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(null)
    }
  }, [publicKey, signTransaction, recipeState, civilization, civilizationCharacterId, connection])

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
                const questMeta = codexQuests.find((q) => Number(q.id) === questId)
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
                const recipeMeta = codexRecipes.find((r) => Number(r.id) === recipeId)
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
