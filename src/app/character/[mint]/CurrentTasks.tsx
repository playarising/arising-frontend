'use client'

import { Accordion, Badge, Box, Button, Flex, Progress, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'
import { claimQuestIx, claimRecipeIx, findCharacterPda } from '@/lib/arising'
import type { CodexQuest, CodexRecipe } from '@/lib/characters'

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

const sanitizeName = (name: string) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const parts = []
  if (hrs) parts.push(`${hrs}h`)
  if (mins || hrs) parts.push(`${mins}m`)
  parts.push(`${secs}s`)
  return parts.join(' ')
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

  const resolveProgress = (state: QuestState | RecipeState | null) => {
    if (!state) return null
    const started = Number(state.started_at ?? state.startedAt ?? NaN)
    const ready = Number(state.ready_at ?? state.readyAt ?? NaN)
    if (!Number.isFinite(started) || !Number.isFinite(ready)) return null
    const duration = Math.max(0, ready - started)
    const elapsed = Math.max(0, currentTime - started)
    const percent = duration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100))) : 100
    const remaining = Math.max(0, ready - currentTime)
    const claimable = remaining <= 0
    return { percent, remaining, claimable }
  }

  const questProgress = resolveProgress(questState)
  const recipeProgress = resolveProgress(recipeState)

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
              <Stack gap={3}>
                {(() => {
                  const questId = Number(questState.quest_id ?? questState.questId ?? NaN)
                  const questMeta = codexQuests.find((q) => Number(q.id) === questId)
                  const title = questMeta?.displayName ?? (Number.isFinite(questId) ? `Quest #${questId}` : 'Quest')
                  const parts = title.split('-').map((p) => p.trim()).filter(Boolean)
                  return (
                    <Stack gap={0}>
                      {parts.length
                        ? parts.map((line) => (
                            <Text key={line} color="gray.300" fontSize="sm">
                              {line}
                            </Text>
                          ))
                        : (
                            <Text color="gray.300" fontSize="sm">
                              {title}
                            </Text>
                          )}
                    </Stack>
                  )
                })()}
                <Box>
                  <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                    REWARDS
                  </Text>
                  {(() => {
                    const questId = Number(questState.quest_id ?? questState.questId ?? NaN)
                    const questMeta = codexQuests.find((q) => Number(q.id) === questId)
                    const rewards = questMeta?.rewards ?? questState.rewards
                    if (Array.isArray(rewards) && rewards.length > 0) {
                      return (
                        <Flex gap={1.5} flexWrap="wrap" justifyContent="center">
                          {rewards.map((reward, idx) => {
                            if (reward && typeof reward === 'object') {
                              const amount = String((reward as Record<string, unknown>).amount ?? '')
                              const resource = String(
                                (reward as Record<string, unknown>).resource ??
                                  (reward as Record<string, unknown>).type ??
                                  'Reward'
                              )
                              return (
                                <Badge key={idx} colorScheme="green" fontSize="xs" px={2} py={0.5}>
                                  {amount} {resource}
                                </Badge>
                              )
                            }
                            return null
                          })}
                        </Flex>
                      )
                    }
                    return (
                      <Flex justifyContent="center">
                        <Badge colorScheme="gray" fontSize="xs">
                          None
                        </Badge>
                      </Flex>
                    )
                  })()}
                </Box>
                {questProgress && (
                  <>
                    <Progress.Root
                      shape="rounded"
                      value={questProgress.percent}
                      max={100}
                      size="lg"
                      width="full"
                      paddingX={4}
                      paddingY={2}
                    >
                      <Progress.Track background="custom-dark-primary">
                        <Progress.Range background="custom-keppel" />
                      </Progress.Track>
                    </Progress.Root>
                    <Stack gap={1} align="center">
                      <Text color="gray.300" fontSize="sm" fontWeight="600">
                        {questProgress.percent}%
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        {questProgress.claimable
                          ? 'Ready to claim'
                          : `Ready in ${formatDuration(questProgress.remaining)}`}
                      </Text>
                    </Stack>
                  </>
                )}
                <Button
                  size="sm"
                  background="custom-blue"
                  color="black"
                  fontWeight="700"
                  _hover={{ bg: 'white', color: 'black' }}
                  disabled={!questProgress?.claimable || submitting === 'quest'}
                  opacity={questProgress?.claimable && submitting !== 'quest' ? 1 : 0.5}
                  cursor={questProgress?.claimable && submitting !== 'quest' ? 'pointer' : 'not-allowed'}
                  width="full"
                  onClick={handleClaimQuest}
                >
                  {submitting === 'quest' ? 'Submitting...' : 'Claim quest'}
                </Button>
              </Stack>
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
              <Stack gap={3}>
                {(() => {
                  const recipeId = Number(recipeState.recipe_id ?? recipeState.recipeId ?? NaN)
                  const recipeMeta = codexRecipes.find((r) => Number(r.id) === recipeId)
                  const displayName =
                    recipeMeta?.displayName ?? (Number.isFinite(recipeId) ? `Recipe #${recipeId}` : 'Recipe')
                  const parts = sanitizeName(displayName)
                    .split('-')
                    .map((p) => p.trim())
                    .filter(Boolean)
                  return (
                    <Stack gap={0}>
                      {parts.length
                        ? parts.map((line) => (
                            <Text key={line} color="gray.300" fontSize="sm">
                              {line}
                            </Text>
                          ))
                        : (
                            <Text color="gray.300" fontSize="sm">
                              {sanitizeName(displayName)}
                            </Text>
                          )}
                    </Stack>
                  )
                })()}
                <Box>
                  <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                    PRODUCES
                  </Text>
                  {(() => {
                    const recipeId = Number(recipeState.recipe_id ?? recipeState.recipeId ?? NaN)
                    const recipeMeta = codexRecipes.find((r) => Number(r.id) === recipeId)
                    const output = recipeMeta?.output ?? recipeState.output
                    if (output && typeof output === 'object' && !Array.isArray(output)) {
                      const obj = output as Record<string, unknown>
                      const amount = String(obj.amount ?? '')
                      const rawRes = obj.resource ?? obj.type ?? 'Item'
                      const resource = sanitizeName(String(rawRes))
                      return (
                        <Flex justifyContent="center">
                          <Badge colorScheme="green" fontSize="xs" px={2} py={0.5}>
                            {amount} {resource}
                          </Badge>
                        </Flex>
                      )
                    }
                    return (
                      <Flex justifyContent="center">
                        <Badge colorScheme="gray" fontSize="xs">
                          None
                        </Badge>
                      </Flex>
                    )
                  })()}
                </Box>
                {recipeProgress && (
                  <>
                    <Progress.Root
                      shape="rounded"
                      value={recipeProgress.percent}
                      max={100}
                      size="lg"
                      width="full"
                      paddingX={4}
                      paddingY={2}
                    >
                      <Progress.Track background="custom-dark-primary">
                        <Progress.Range background="custom-keppel" />
                      </Progress.Track>
                    </Progress.Root>
                    <Stack gap={1} align="center">
                      <Text color="gray.300" fontSize="sm" fontWeight="600">
                        {recipeProgress.percent}%
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        {recipeProgress.claimable
                          ? 'Ready to claim'
                          : `Ready in ${formatDuration(recipeProgress.remaining)}`}
                      </Text>
                    </Stack>
                  </>
                )}
                <Button
                  size="sm"
                  background="custom-blue"
                  color="black"
                  fontWeight="700"
                  _hover={{ bg: 'white', color: 'black' }}
                  disabled={!recipeProgress?.claimable || submitting === 'recipe'}
                  opacity={recipeProgress?.claimable && submitting !== 'recipe' ? 1 : 0.5}
                  cursor={recipeProgress?.claimable && submitting !== 'recipe' ? 'pointer' : 'not-allowed'}
                  width="full"
                  onClick={handleClaimRecipe}
                >
                  {submitting === 'recipe' ? 'Submitting...' : 'Claim craft'}
                </Button>
              </Stack>
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
