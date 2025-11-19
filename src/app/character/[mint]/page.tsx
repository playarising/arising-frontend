import { Accordion, Badge, Box, Button, Flex, Grid, GridItem, Progress, Stack, Text } from '@chakra-ui/react'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  authOptions,
  fetchCharacterMetadata,
  fetchCharactersForAuthority,
  fetchCodex,
  levelFromExperience
} from '@/lib'
import { ActionsSwitcher } from './ActionsSwitcher'
import { EnergyStatus } from './EnergyStatus'

type Params = Promise<{ mint: string }>

export default async function CharacterPage({ params }: { params: Params }) {
  const { mint } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.address) {
    redirect('/play')
  }

  const owned = await fetchCharactersForAuthority(session.user.address).catch(() => [])
  const character = owned.find((c) => c.nftMint === mint)
  if (!character) notFound()

  const metadata = await fetchCharacterMetadata(character.civilization, character.civilizationCharacterId).catch(
    () => undefined
  )
  const codex = await fetchCodex()
  const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC?.trim() || clusterApiUrl('devnet')
  const connection = new Connection(rpcEndpoint, 'confirmed')
  const ownerKey = new PublicKey(session.user.address)

  const metadataLevelAttr = metadata?.attributes?.find((attr) => attr.trait_type === 'Level')?.value
  const metadataLevelNumber =
    typeof metadataLevelAttr === 'number' ? metadataLevelAttr : Number(metadataLevelAttr ?? NaN)
  const parsedEnergy = typeof character.energy === 'string' ? Number(character.energy) : (character.energy ?? 0)
  const parsedLastRefill =
    typeof character.lastEnergyRefill === 'string'
      ? Number.parseInt(character.lastEnergyRefill, 10)
      : typeof character.lastEnergyRefill === 'number'
        ? character.lastEnergyRefill
        : 0
  const characterLevel =
    Number.isFinite(character.experience) && character.experience !== null
      ? levelFromExperience(character.experience ?? 0)
      : Number.isFinite(metadataLevelNumber)
        ? Number(metadataLevelNumber)
        : 1
  const maxEnergy = 10 + (characterLevel - 1)
  const REFILL_COOLDOWN_SECONDS = 24 * 60 * 60
  const nextRefillSeconds = parsedLastRefill + REFILL_COOLDOWN_SECONDS
  let parsedStatsObj: Record<string, unknown> = {}
  if (typeof character.stats === 'string') {
    try {
      parsedStatsObj = JSON.parse(character.stats)
    } catch {
      parsedStatsObj = {}
    }
  } else if (typeof character.stats === 'object' && character.stats) {
    parsedStatsObj = character.stats
  }
  const parsedStatsEntries = Object.entries(parsedStatsObj).filter(([, value]) => typeof value === 'number') as Array<
    [string, number]
  >
  const totalCorePoints = Math.max(0, characterLevel - 1)
  const spentCorePoints = parsedStatsEntries.reduce((acc, [, value]) => acc + value, 0)
  const availableCorePoints = Math.max(0, totalCorePoints - spentCorePoints)

  let parsedAttributesObj: Record<string, unknown> = {}
  if (typeof character.attributes === 'string') {
    try {
      parsedAttributesObj = JSON.parse(character.attributes)
    } catch {
      parsedAttributesObj = {}
    }
  } else if (typeof character.attributes === 'object' && character.attributes) {
    parsedAttributesObj = character.attributes
  }

  const parsedAttributesEntries = Object.entries(parsedAttributesObj).filter(
    ([, value]) => typeof value === 'number'
  ) as Array<[string, number]>
  const totalAttributePoints = Math.max(0, Math.floor((characterLevel - 1) / 5))
  const availableAttributePoints = totalAttributePoints
  const formatLabel = (key: string) =>
    key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
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

  const parseState = (value: string | object | null | undefined) => {
    if (!value) return null
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as Record<string, string | number>
      } catch {
        return null
      }
    }
    if (typeof value === 'object') return value as Record<string, string | number>
    return null
  }

  const resolvedQuestState = parseState(character.currentQuest)
  const resolvedRecipeState = parseState(character.currentRecipe)

  const resolveProgress = (state: Record<string, unknown> | null) => {
    if (!state) return null
    const started = Number(state.started_at ?? state.startedAt ?? NaN)
    const ready = Number(state.ready_at ?? state.readyAt ?? NaN)
    if (!Number.isFinite(started) || !Number.isFinite(ready)) return null
    const nowSec = Math.floor(Date.now() / 1000)
    const duration = Math.max(0, ready - started)
    const elapsed = Math.max(0, nowSec - started)
    const percent = duration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100))) : 100
    const remaining = Math.max(0, ready - nowSec)
    const claimable = remaining <= 0
    return { percent, remaining, claimable }
  }

  const questProgress = resolveProgress(resolvedQuestState)
  const recipeProgress = resolveProgress(resolvedRecipeState)

  const availableQuests = codex.quests
    .filter((item) => (item.levelRequired ?? 0) <= characterLevel)
    .sort((a, b) => a.levelRequired - b.levelRequired || a.id - b.id)
  const availableRecipes = codex.recipes
    .filter((item) => (item.levelRequired ?? 0) <= characterLevel)
    .sort((a, b) => a.levelRequired - b.levelRequired || a.id - b.id)

  const questsForClient = availableQuests.map((q) => ({
    id: q.id,
    name: q.displayName,
    levelRequired: q.levelRequired,
    energyCost: q.baseEnergyCost,
    type: q.questType,
    rewards: q.rewards,
    requirements: q.minimumStats
  }))

  const recipesForClient = availableRecipes.map((r) => ({
    id: r.id,
    name: r.displayName,
    levelRequired: r.levelRequired,
    type: r.recipeType,
    energyCost: r.baseEnergyCost,
    input: r.input,
    output: r.output
  }))

  const resourceMintMap = new Map(
    codex.resourceMints.map((r) => [r.mint, { resource: r.resource, displayName: r.displayName, mint: r.mint }])
  )

  const ownerTokenAccounts = await connection
    .getTokenAccountsByOwner(ownerKey, { programId: TOKEN_PROGRAM_ID })
    .catch(() => ({ value: [] }))

  const inventoryBalances: { resource: string; displayName: string; mint: string; amount: number }[] = []

  for (const acc of ownerTokenAccounts.value) {
    try {
      const decoded = AccountLayout.decode(acc.account.data)
      const mintB58 = new PublicKey(decoded.mint).toBase58()
      const meta = resourceMintMap.get(mintB58)
      if (!meta) continue
      const asNumber = Number(BigInt(decoded.amount.toString()))
      if (asNumber <= 0) continue
      inventoryBalances.push({
        resource: meta.resource,
        displayName: meta.displayName,
        mint: meta.mint,
        amount: asNumber
      })
    } catch {
      // ignore malformed accounts
    }
  }

  const renderStatsAccordions = (
    valuePrefix: string,
    options?: {
      includeAttributes?: boolean
      includeTasks?: boolean
      includeInventory?: boolean
      includeEquipment?: boolean
    }
  ) => (
    <Accordion.Root
      collapsible
      border="1px solid rgba(255,255,255,0.08)"
      borderRadius="md"
      bg="rgba(255,255,255,0.02)"
      width="full"
    >
      <Accordion.Item value={`${valuePrefix}-core`}>
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
            Base stats
          </Text>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody paddingX={3} paddingY={3}>
            <Stack gap={2} color="gray.300" fontSize="sm">
              {parsedStatsEntries.length === 0 ? (
                <Text color="gray.500">No stats available.</Text>
              ) : (
                parsedStatsEntries.map(([key, value]) => (
                  <Stack
                    key={key}
                    direction="row"
                    justify="space-between"
                    align="center"
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="md"
                    padding={3}
                    bg="rgba(255,255,255,0.02)"
                  >
                    <Text color="white" fontWeight="700">
                      {formatLabel(key)}
                    </Text>
                    <Stack direction="row" align="center" gap={2}>
                      <Text color="gray.200">{value}</Text>
                      {availableCorePoints > 0 && (
                        <Box
                          as="button"
                          aria-label={`Increase ${key}`}
                          border="1px solid rgba(255,255,255,0.35)"
                          borderRadius="full"
                          width="26px"
                          height="26px"
                          display="grid"
                          placeItems="center"
                          color="white"
                          background="rgba(255,255,255,0.08)"
                          _hover={{ bg: 'white', color: 'black' }}
                          cursor="pointer"
                        >
                          +
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                ))
              )}
            </Stack>
            <Button
              mt={3}
              size="sm"
              background="custom-blue"
              color="black"
              fontWeight="700"
              _hover={{ bg: 'white', color: 'black' }}
              disabled={availableCorePoints <= 0}
              width="full"
            >
              Spend points ({availableCorePoints})
            </Button>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
      {options?.includeAttributes !== false && (
        <Accordion.Item value={`${valuePrefix}-attributes`}>
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
              Attributes
            </Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody paddingX={3} paddingY={3}>
              <Stack gap={2} color="gray.300" fontSize="sm">
                {parsedAttributesEntries.length === 0 ? (
                  <Text color="gray.500">No attributes available.</Text>
                ) : (
                  parsedAttributesEntries.map(([key, value]) => (
                    <Stack
                      key={key}
                      direction="row"
                      justify="space-between"
                      align="center"
                      border="1px solid rgba(255,255,255,0.08)"
                      borderRadius="md"
                      padding={3}
                      bg="rgba(255,255,255,0.02)"
                    >
                      <Text color="white" fontWeight="700">
                        {formatLabel(key)}
                      </Text>
                      <Stack direction="row" align="center" gap={2}>
                        <Text color="gray.200">{value}</Text>
                        {availableAttributePoints > 0 && (
                          <Box
                            as="button"
                            aria-label={`Increase ${key}`}
                            border="1px solid rgba(255,255,255,0.35)"
                            borderRadius="full"
                            width="26px"
                            height="26px"
                            display="grid"
                            placeItems="center"
                            color="white"
                            background="rgba(255,255,255,0.08)"
                            _hover={{ bg: 'white', color: 'black' }}
                            cursor="pointer"
                          >
                            +
                          </Box>
                        )}
                      </Stack>
                    </Stack>
                  ))
                )}
              </Stack>
              <Button
                mt={3}
                size="sm"
                background="custom-blue"
                color="black"
                fontWeight="700"
                _hover={{ bg: 'white', color: 'black' }}
                disabled={availableAttributePoints <= 0}
                width="full"
              >
                Spend points ({availableAttributePoints})
              </Button>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      )}
      {options?.includeTasks && (
        <>
          <Accordion.Item value={`${valuePrefix}-current-quest`}>
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
                {resolvedQuestState ? (
                  <Stack gap={3}>
                    <Text color="white" fontWeight="800" fontSize="md">
                      {(() => {
                        const questId = Number(resolvedQuestState.quest_id ?? resolvedQuestState.questId ?? NaN)
                        const questMeta = codex.quests.find((q) => Number(q.id) === questId)
                        return questMeta?.displayName ?? (Number.isFinite(questId) ? `Quest #${questId}` : 'Quest')
                      })()}
                    </Text>
                    <Box>
                      <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                        REWARDS
                      </Text>
                      {(() => {
                        const questId = Number(resolvedQuestState.quest_id ?? resolvedQuestState.questId ?? NaN)
                        const questMeta = codex.quests.find((q) => Number(q.id) === questId)
                        const rewards = questMeta?.rewards ?? resolvedQuestState.rewards
                        if (Array.isArray(rewards) && rewards.length > 0) {
                          return (
                            <Flex gap={1.5} flexWrap="wrap">
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
                          <Badge colorScheme="gray" fontSize="xs">
                            None
                          </Badge>
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
                        <Text color="gray.400" fontSize="xs">
                          {questProgress.claimable
                            ? 'Ready to claim'
                            : `Ready in ${formatDuration(questProgress.remaining)}`}
                        </Text>
                      </>
                    )}
                    <Button
                      size="sm"
                      background="custom-blue"
                      color="black"
                      fontWeight="700"
                      _hover={{ bg: 'white', color: 'black' }}
                      disabled={!questProgress?.claimable}
                      width="full"
                    >
                      Claim quest
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

          <Accordion.Item value={`${valuePrefix}-current-recipe`}>
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
                {resolvedRecipeState ? (
                  <Stack gap={3}>
                    <Text color="white" fontWeight="800" fontSize="md">
                      {(() => {
                        const recipeId = Number(resolvedRecipeState.recipe_id ?? resolvedRecipeState.recipeId ?? NaN)
                        const recipeMeta = codex.recipes.find((r) => Number(r.id) === recipeId)
                        const displayName = recipeMeta?.displayName ?? (Number.isFinite(recipeId) ? `Recipe #${recipeId}` : 'Recipe')
                        return sanitizeName(displayName)
                      })()}
                    </Text>
                    <Box>
                      <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
                        PRODUCES
                      </Text>
                      {(() => {
                        const recipeId = Number(resolvedRecipeState.recipe_id ?? resolvedRecipeState.recipeId ?? NaN)
                        const recipeMeta = codex.recipes.find((r) => Number(r.id) === recipeId)
                        const output = recipeMeta?.output ?? resolvedRecipeState.output
                        if (output && typeof output === 'object' && !Array.isArray(output)) {
                          const obj = output as Record<string, unknown>
                          const amount = String(obj.amount ?? '')
                          const rawRes = obj.resource ?? obj.type ?? 'Item'
                          const resource = sanitizeName(String(rawRes))
                          return (
                            <Badge colorScheme="green" fontSize="xs" px={2} py={0.5}>
                              {amount} {resource}
                            </Badge>
                          )
                        }
                        return (
                          <Badge colorScheme="gray" fontSize="xs">
                            None
                          </Badge>
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
                        <Text color="gray.400" fontSize="xs">
                          {recipeProgress.claimable
                            ? 'Ready to claim'
                            : `Ready in ${formatDuration(recipeProgress.remaining)}`}
                        </Text>
                      </>
                    )}
                    <Button
                      size="sm"
                      background="custom-blue"
                      color="black"
                      fontWeight="700"
                      _hover={{ bg: 'white', color: 'black' }}
                      disabled={!recipeProgress?.claimable}
                      width="full"
                    >
                      Claim craft
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
      )}
      {options?.includeInventory && (
        <Accordion.Item value={`${valuePrefix}-inventory`}>
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
              Inventory
            </Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody paddingX={3} paddingY={3}>
              {inventoryBalances.length ? (
                <Stack gap={2} color="gray.300" fontSize="sm">
                  {inventoryBalances.map((item) => (
                    <Stack
                      key={item.mint}
                      direction="row"
                      justify="space-between"
                      align="center"
                      border="1px solid rgba(255,255,255,0.08)"
                      borderRadius="md"
                      padding={3}
                      bg="rgba(255,255,255,0.02)"
                    >
                      <Text color="white" fontWeight="700">
                        {item.displayName}
                      </Text>
                      <Stack align="flex-end">
                        <Text color="gray.200">{item.amount}</Text>
                        <Text color="gray.500" fontSize="xs">
                          {item.mint}
                        </Text>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Text color="gray.500" fontSize="sm">
                  None
                </Text>
              )}
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      )}
      {options?.includeEquipment && (
        <Accordion.Item value={`${valuePrefix}-equipment`}>
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
              Equipment
            </Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody paddingX={3} paddingY={3}>
              <Text color="gray.500" fontSize="sm">
                Coming soon
              </Text>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      )}
    </Accordion.Root>
  )

  return (
    <Stack align="center" justify="center" minH="100vh" bg="black" paddingY={16} paddingX={{ base: 4, md: 8 }}>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 3fr' }} gap={{ base: 6, lg: 10 }} width="full" maxW="1200px">
        <GridItem>
          <Stack
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.04)"
            padding={8}
            borderRadius="xl"
            width="full"
            gap={4}
            align="center"
            textAlign="center"
          >
            {metadata?.image ? (
              <Image
                alt={metadata?.name ?? 'Character image'}
                src={metadata.image}
                width={640}
                height={360}
                style={{ objectFit: 'contain', borderRadius: 16, width: '100%', maxHeight: 360 }}
                unoptimized
              />
            ) : null}
            {metadata?.name ? (
              <Text color="gray.100" fontWeight="700" fontSize="xl">
                {metadata.name}
              </Text>
            ) : null}
            <Text color="gray.300" fontSize="sm">
              Level {characterLevel}
            </Text>
            <EnergyStatus energy={parsedEnergy} maxEnergy={maxEnergy} nextRefillEpochSeconds={nextRefillSeconds} />
            {renderStatsAccordions('overview', {
              includeAttributes: true,
              includeTasks: true,
              includeInventory: true,
              includeEquipment: true
            })}
          </Stack>
        </GridItem>

        <GridItem>
          <Stack
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.04)"
            padding={8}
            borderRadius="xl"
            width="full"
            gap={4}
          >
            <ActionsSwitcher
              quests={questsForClient}
              recipes={recipesForClient}
              characterLevel={characterLevel}
              characterEnergy={parsedEnergy}
              characterStats={Object.fromEntries(parsedStatsEntries)}
              inventory={inventoryBalances}
              civilization={character.civilization}
              civilizationCharacterId={character.civilizationCharacterId}
            />
          </Stack>
        </GridItem>
      </Grid>
    </Stack>
  )
}
