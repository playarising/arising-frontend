import { Accordion, Flex, Grid, GridItem, Progress, Stack, Text } from '@chakra-ui/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ActionsSwitcher, CurrentTasks, EnergyStatus, StatAllocationList } from '@/features'
import {
  authOptions,
  fetchCharacterMetadata,
  fetchCharactersForAuthority,
  LEVEL_CURVE,
  levelFromExperience
} from '@/lib'

type Params = Promise<{ mint: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mint } = await params

  // We need to fetch the character to get its details
  // Since we don't have the authority here easily without session, we might need a direct fetch by mint
  // Assuming fetchCharacterByMint exists or we can use fetchCharactersForAuthority if we had the owner.
  // But for SEO, we want public data.
  // Let's check if we can fetch by mint directly.
  // Based on previous analysis, there is a fetchCharacterByMint in lib/characters.ts

  const { fetchCharacterByMint } = await import('@/lib')
  const character = await fetchCharacterByMint(mint)

  if (!character) {
    return {
      title: 'Character Not Found | Arising',
      description: 'The requested character could not be found.'
    }
  }

  const { fetchCharacterMetadata } = await import('@/lib')
  const metadata = await fetchCharacterMetadata(character.civilization, character.civilizationCharacterId).catch(
    () => undefined
  )

  const name = metadata?.name ?? `Character ${mint.slice(0, 8)}`
  const level = metadata?.attributes?.find((a) => a.trait_type === 'Level')?.value ?? 'Unknown'
  const civ = character.civilization

  return {
    title: `${name} | Arising`,
    description: `Level ${level} ${civ} Character in Arising. View their stats, equipment, and progress.`,
    openGraph: {
      title: `${name} | Arising`,
      description: `Level ${level} ${civ} Character in Arising.`,
      images: metadata?.image ? [{ url: metadata.image }] : []
    }
  }
}

export default async function CharacterPage({ params }: { params: Params }) {
  const { mint } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.address) {
    redirect('/play')
  }

  const owned = await fetchCharactersForAuthority(session.user.address).catch(() => [])
  const character = owned.find((c) => c.nftMint === mint)
  if (!character) notFound()

  const [metadata] = await Promise.all([
    fetchCharacterMetadata(character.civilization, character.civilizationCharacterId).catch(() => undefined)
  ])

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
  const rawExperience =
    typeof character.experience === 'string'
      ? Number.parseInt(character.experience, 10)
      : typeof character.experience === 'number'
        ? character.experience
        : null
  const hasExperienceData = rawExperience !== null && Number.isFinite(rawExperience)
  const totalExperience = hasExperienceData ? Number(rawExperience) : 0
  const characterLevel = hasExperienceData
    ? levelFromExperience(totalExperience)
    : Number.isFinite(metadataLevelNumber)
      ? Number(metadataLevelNumber)
      : 1
  const prevThreshold =
    characterLevel > 1 ? (LEVEL_CURVE.find((entry) => entry.level === characterLevel - 1)?.cumulativeXp ?? 0) : 0
  const currentCurveEntry = LEVEL_CURVE.find((entry) => entry.level === characterLevel)
  const xpNeededThisLevel = currentCurveEntry?.xpToNext ?? 0
  const xpIntoCurrentLevel = hasExperienceData ? Math.max(0, totalExperience - prevThreshold) : 0
  const clampedXpProgress = Math.min(xpNeededThisLevel, xpIntoCurrentLevel)
  const xpProgressPercent = hasExperienceData
    ? xpNeededThisLevel > 0
      ? Math.max(0, Math.min(100, Math.round((clampedXpProgress / xpNeededThisLevel) * 100)))
      : 100
    : 0
  const xpRemaining = xpNeededThisLevel > 0 ? Math.max(0, xpNeededThisLevel - clampedXpProgress) : 0
  const maxEnergy = 10 + Math.max(0, characterLevel - 1)
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
  const toNumericEntries = (input: Record<string, unknown>) =>
    Object.entries(input).reduce<Array<[string, number]>>((acc, [key, value]) => {
      const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      if (Number.isFinite(parsed)) acc.push([key, parsed])
      return acc
    }, [])

  const parsedStatsEntries = toNumericEntries(parsedStatsObj)
  const parsedStatsNumbers = Object.fromEntries(parsedStatsEntries) as Record<string, number>

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

  const parsedAttributesEntries = toNumericEntries(parsedAttributesObj)
  const parsedAttributesNumbers = Object.fromEntries(parsedAttributesEntries) as Record<string, number>

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
            <StatAllocationList
              type="core"
              civilization={character.civilization}
              civilizationCharacterId={character.civilizationCharacterId}
              level={characterLevel}
              stats={parsedStatsNumbers}
            />
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
              <StatAllocationList
                type="attribute"
                civilization={character.civilization}
                civilizationCharacterId={character.civilizationCharacterId}
                level={characterLevel}
                stats={parsedAttributesNumbers}
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      )}
      {options?.includeTasks && (
        <CurrentTasks
          questState={resolvedQuestState}
          recipeState={resolvedRecipeState}
          codexQuests={[]}
          codexRecipes={[]}
          civilization={character.civilization}
          civilizationCharacterId={character.civilizationCharacterId}
        />
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
              <Text color="gray.500" fontSize="sm">
                Inventory will appear after your wallet syncs on the client.
              </Text>
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
    <Stack
      align="center"
      justify="center"
      minH="100vh"
      bg="black"
      paddingY={16}
      paddingX={{ base: 4, md: 8 }}
      paddingTop={{ base: 28, md: 36 }}
    >
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
            <Stack width="full" gap={1}>
              <Flex width="full" justify="space-between" align="center">
                <Text color="gray.400" fontSize="xs" fontWeight="600">
                  Experience
                </Text>
                {hasExperienceData ? (
                  xpNeededThisLevel > 0 ? (
                    <Text color="gray.100" fontSize="xs" fontWeight="700">
                      {clampedXpProgress.toLocaleString()} / {xpNeededThisLevel.toLocaleString()} XP
                    </Text>
                  ) : (
                    <Text color="gray.100" fontSize="xs" fontWeight="700">
                      {totalExperience.toLocaleString()} XP
                    </Text>
                  )
                ) : (
                  <Text color="gray.500" fontSize="xs">
                    XP data unavailable
                  </Text>
                )}
              </Flex>
              <Progress.Root shape="rounded" value={xpProgressPercent} max={100} size="md" width="full">
                <Progress.Track background="custom-dark-primary">
                  <Progress.Range background="custom-keppel" />
                </Progress.Track>
              </Progress.Root>
              <Text color="gray.500" fontSize="xs">
                {hasExperienceData
                  ? xpNeededThisLevel > 0
                    ? `${xpRemaining.toLocaleString()} XP to level up`
                    : 'Maximum level reached'
                  : 'Level progression unavailable'}
              </Text>
            </Stack>
            <EnergyStatus
              energy={parsedEnergy}
              maxEnergy={maxEnergy}
              nextRefillEpochSeconds={nextRefillSeconds}
              civilization={character.civilization}
              civilizationCharacterId={character.civilizationCharacterId}
            />
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
              quests={[]}
              recipes={[]}
              characterLevel={characterLevel}
              characterEnergy={parsedEnergy}
              characterStats={Object.fromEntries(parsedStatsEntries)}
              civilization={character.civilization}
              civilizationCharacterId={character.civilizationCharacterId}
              currentQuest={resolvedQuestState}
              currentRecipe={resolvedRecipeState}
            />
          </Stack>
        </GridItem>
      </Grid>
    </Stack>
  )
}
