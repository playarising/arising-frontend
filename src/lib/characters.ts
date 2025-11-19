const INDEXER_ENDPOINT = 'https://indexer.playarising.com/graphql'

export type CharacterRecord = {
  pubkey: string
  authority?: string
  civilization: string
  civilizationCharacterId: number
  nftMint: string
  energy?: number | null
  experience?: number | null
  lastEnergyRefill?: number | string | null
  stats?: Record<string, number> | string | null
  attributes?: Record<string, number> | string | null
  currentQuest?: unknown
  currentRecipe?: unknown
}

export type CharacterWithMetadata = CharacterRecord & {
  metadata?: {
    name?: string
    image?: string
    description?: string
    attributes?: { trait_type?: string; value?: string | number }[]
  }
}

export type LevelCurveEntry = {
  level: number
  xpToNext: number
  cumulativeXp: number
}

export type CodexEquipment = {
  idx: number
  displayName: string
  category: string
  allowedSlots: unknown
  occupiesBothHands: boolean
  occupiesForearm: boolean
  levelRequired: number
  attributeBonus: unknown
  raw: unknown
}

export type CodexQuest = {
  id: number
  questType: string
  name?: string
  displayName: string
  levelRequired: number
  cooldownSeconds: number
  baseEnergyCost: number
  minimumStats: unknown
  rewards: unknown
  raw: unknown
}

export type CodexRecipe = {
  id: number
  recipeType: string
  name?: string
  displayName: string
  levelRequired: number
  cooldownSeconds: number
  baseEnergyCost: number
  minimumStats: unknown
  input: unknown
  output: unknown
  raw: unknown
}

export type CodexResourceMint = {
  resourceId: number
  resource: string
  displayName: string
  mint: string
  raw: unknown
}

export const LEVEL_CAP = 150

export const LEVEL_CURVE: readonly LevelCurveEntry[] = [
  { level: 1, xpToNext: 50, cumulativeXp: 50 },
  { level: 2, xpToNext: 70, cumulativeXp: 120 },
  { level: 3, xpToNext: 90, cumulativeXp: 210 },
  { level: 4, xpToNext: 110, cumulativeXp: 320 },
  { level: 5, xpToNext: 130, cumulativeXp: 450 },
  { level: 6, xpToNext: 150, cumulativeXp: 600 },
  { level: 7, xpToNext: 170, cumulativeXp: 770 },
  { level: 8, xpToNext: 190, cumulativeXp: 960 },
  { level: 9, xpToNext: 210, cumulativeXp: 1170 },
  { level: 10, xpToNext: 230, cumulativeXp: 1400 },
  { level: 11, xpToNext: 250, cumulativeXp: 1650 },
  { level: 12, xpToNext: 270, cumulativeXp: 1920 },
  { level: 13, xpToNext: 290, cumulativeXp: 2210 },
  { level: 14, xpToNext: 310, cumulativeXp: 2520 },
  { level: 15, xpToNext: 330, cumulativeXp: 2850 },
  { level: 16, xpToNext: 350, cumulativeXp: 3200 },
  { level: 17, xpToNext: 370, cumulativeXp: 3570 },
  { level: 18, xpToNext: 390, cumulativeXp: 3960 },
  { level: 19, xpToNext: 410, cumulativeXp: 4370 },
  { level: 20, xpToNext: 430, cumulativeXp: 4800 },
  { level: 21, xpToNext: 450, cumulativeXp: 5250 },
  { level: 22, xpToNext: 470, cumulativeXp: 5720 },
  { level: 23, xpToNext: 490, cumulativeXp: 6210 },
  { level: 24, xpToNext: 510, cumulativeXp: 6720 },
  { level: 25, xpToNext: 530, cumulativeXp: 7250 },
  { level: 26, xpToNext: 550, cumulativeXp: 7800 },
  { level: 27, xpToNext: 570, cumulativeXp: 8370 },
  { level: 28, xpToNext: 590, cumulativeXp: 8960 },
  { level: 29, xpToNext: 610, cumulativeXp: 9570 },
  { level: 30, xpToNext: 630, cumulativeXp: 10200 },
  { level: 31, xpToNext: 650, cumulativeXp: 10850 },
  { level: 32, xpToNext: 670, cumulativeXp: 11520 },
  { level: 33, xpToNext: 690, cumulativeXp: 12210 },
  { level: 34, xpToNext: 710, cumulativeXp: 12920 },
  { level: 35, xpToNext: 730, cumulativeXp: 13650 },
  { level: 36, xpToNext: 750, cumulativeXp: 14400 },
  { level: 37, xpToNext: 770, cumulativeXp: 15170 },
  { level: 38, xpToNext: 790, cumulativeXp: 15960 },
  { level: 39, xpToNext: 810, cumulativeXp: 16770 },
  { level: 40, xpToNext: 830, cumulativeXp: 17600 },
  { level: 41, xpToNext: 850, cumulativeXp: 18450 },
  { level: 42, xpToNext: 870, cumulativeXp: 19320 },
  { level: 43, xpToNext: 890, cumulativeXp: 20210 },
  { level: 44, xpToNext: 910, cumulativeXp: 21120 },
  { level: 45, xpToNext: 930, cumulativeXp: 22050 },
  { level: 46, xpToNext: 950, cumulativeXp: 23000 },
  { level: 47, xpToNext: 970, cumulativeXp: 23970 },
  { level: 48, xpToNext: 990, cumulativeXp: 24960 },
  { level: 49, xpToNext: 1010, cumulativeXp: 25970 },
  { level: 50, xpToNext: 1030, cumulativeXp: 27000 },
  { level: 51, xpToNext: 1050, cumulativeXp: 28050 },
  { level: 52, xpToNext: 1070, cumulativeXp: 29120 },
  { level: 53, xpToNext: 1090, cumulativeXp: 30210 },
  { level: 54, xpToNext: 1110, cumulativeXp: 31320 },
  { level: 55, xpToNext: 1130, cumulativeXp: 32450 },
  { level: 56, xpToNext: 1150, cumulativeXp: 33600 },
  { level: 57, xpToNext: 1170, cumulativeXp: 34770 },
  { level: 58, xpToNext: 1190, cumulativeXp: 35960 },
  { level: 59, xpToNext: 1210, cumulativeXp: 37170 },
  { level: 60, xpToNext: 1230, cumulativeXp: 38400 },
  { level: 61, xpToNext: 1250, cumulativeXp: 39650 },
  { level: 62, xpToNext: 1270, cumulativeXp: 40920 },
  { level: 63, xpToNext: 1290, cumulativeXp: 42210 },
  { level: 64, xpToNext: 1310, cumulativeXp: 43520 },
  { level: 65, xpToNext: 1330, cumulativeXp: 44850 },
  { level: 66, xpToNext: 1350, cumulativeXp: 46200 },
  { level: 67, xpToNext: 1370, cumulativeXp: 47570 },
  { level: 68, xpToNext: 1390, cumulativeXp: 48960 },
  { level: 69, xpToNext: 1410, cumulativeXp: 50370 },
  { level: 70, xpToNext: 1430, cumulativeXp: 51800 },
  { level: 71, xpToNext: 1450, cumulativeXp: 53250 },
  { level: 72, xpToNext: 1470, cumulativeXp: 54720 },
  { level: 73, xpToNext: 1490, cumulativeXp: 56210 },
  { level: 74, xpToNext: 1510, cumulativeXp: 57720 },
  { level: 75, xpToNext: 1530, cumulativeXp: 59250 },
  { level: 76, xpToNext: 1550, cumulativeXp: 60800 },
  { level: 77, xpToNext: 1570, cumulativeXp: 62370 },
  { level: 78, xpToNext: 1590, cumulativeXp: 63960 },
  { level: 79, xpToNext: 1610, cumulativeXp: 65570 },
  { level: 80, xpToNext: 1630, cumulativeXp: 67200 },
  { level: 81, xpToNext: 1650, cumulativeXp: 68850 },
  { level: 82, xpToNext: 1670, cumulativeXp: 70520 },
  { level: 83, xpToNext: 1690, cumulativeXp: 72210 },
  { level: 84, xpToNext: 1710, cumulativeXp: 73920 },
  { level: 85, xpToNext: 1730, cumulativeXp: 75650 },
  { level: 86, xpToNext: 1750, cumulativeXp: 77400 },
  { level: 87, xpToNext: 1770, cumulativeXp: 79170 },
  { level: 88, xpToNext: 1790, cumulativeXp: 80960 },
  { level: 89, xpToNext: 1810, cumulativeXp: 82770 },
  { level: 90, xpToNext: 1830, cumulativeXp: 84600 },
  { level: 91, xpToNext: 1850, cumulativeXp: 86450 },
  { level: 92, xpToNext: 1870, cumulativeXp: 88320 },
  { level: 93, xpToNext: 1890, cumulativeXp: 90210 },
  { level: 94, xpToNext: 1910, cumulativeXp: 92120 },
  { level: 95, xpToNext: 1930, cumulativeXp: 94050 },
  { level: 96, xpToNext: 1950, cumulativeXp: 96000 },
  { level: 97, xpToNext: 1970, cumulativeXp: 97970 },
  { level: 98, xpToNext: 1990, cumulativeXp: 99960 },
  { level: 99, xpToNext: 2010, cumulativeXp: 101970 },
  { level: 100, xpToNext: 2030, cumulativeXp: 104000 },
  { level: 101, xpToNext: 2050, cumulativeXp: 106050 },
  { level: 102, xpToNext: 2070, cumulativeXp: 108120 },
  { level: 103, xpToNext: 2090, cumulativeXp: 110210 },
  { level: 104, xpToNext: 2110, cumulativeXp: 112320 },
  { level: 105, xpToNext: 2130, cumulativeXp: 114450 },
  { level: 106, xpToNext: 2150, cumulativeXp: 116600 },
  { level: 107, xpToNext: 2170, cumulativeXp: 118770 },
  { level: 108, xpToNext: 2190, cumulativeXp: 120960 },
  { level: 109, xpToNext: 2210, cumulativeXp: 123170 },
  { level: 110, xpToNext: 2230, cumulativeXp: 125400 },
  { level: 111, xpToNext: 2250, cumulativeXp: 127650 },
  { level: 112, xpToNext: 2270, cumulativeXp: 129920 },
  { level: 113, xpToNext: 2290, cumulativeXp: 132210 },
  { level: 114, xpToNext: 2310, cumulativeXp: 134520 },
  { level: 115, xpToNext: 2330, cumulativeXp: 136850 },
  { level: 116, xpToNext: 2350, cumulativeXp: 139200 },
  { level: 117, xpToNext: 2370, cumulativeXp: 141570 },
  { level: 118, xpToNext: 2390, cumulativeXp: 143960 },
  { level: 119, xpToNext: 2410, cumulativeXp: 146370 },
  { level: 120, xpToNext: 2430, cumulativeXp: 148800 },
  { level: 121, xpToNext: 2450, cumulativeXp: 151250 },
  { level: 122, xpToNext: 2470, cumulativeXp: 153720 },
  { level: 123, xpToNext: 2490, cumulativeXp: 156210 },
  { level: 124, xpToNext: 2510, cumulativeXp: 158720 },
  { level: 125, xpToNext: 2530, cumulativeXp: 161250 },
  { level: 126, xpToNext: 2550, cumulativeXp: 163800 },
  { level: 127, xpToNext: 2570, cumulativeXp: 166370 },
  { level: 128, xpToNext: 2590, cumulativeXp: 168960 },
  { level: 129, xpToNext: 2610, cumulativeXp: 171570 },
  { level: 130, xpToNext: 2630, cumulativeXp: 174200 },
  { level: 131, xpToNext: 2650, cumulativeXp: 176850 },
  { level: 132, xpToNext: 2670, cumulativeXp: 179520 },
  { level: 133, xpToNext: 2690, cumulativeXp: 182210 },
  { level: 134, xpToNext: 2710, cumulativeXp: 184920 },
  { level: 135, xpToNext: 2730, cumulativeXp: 187650 },
  { level: 136, xpToNext: 2750, cumulativeXp: 190400 },
  { level: 137, xpToNext: 2770, cumulativeXp: 193170 },
  { level: 138, xpToNext: 2790, cumulativeXp: 195960 },
  { level: 139, xpToNext: 2810, cumulativeXp: 198770 },
  { level: 140, xpToNext: 2830, cumulativeXp: 201600 },
  { level: 141, xpToNext: 2850, cumulativeXp: 204450 },
  { level: 142, xpToNext: 2870, cumulativeXp: 207320 },
  { level: 143, xpToNext: 2890, cumulativeXp: 210210 },
  { level: 144, xpToNext: 2910, cumulativeXp: 213120 },
  { level: 145, xpToNext: 2930, cumulativeXp: 216050 },
  { level: 146, xpToNext: 2950, cumulativeXp: 219000 },
  { level: 147, xpToNext: 2970, cumulativeXp: 221970 },
  { level: 148, xpToNext: 2990, cumulativeXp: 224960 },
  { level: 149, xpToNext: 3010, cumulativeXp: 227970 }
] as const

export const levelFromExperience = (totalXp: number): number => {
  if (!Number.isFinite(totalXp) || totalXp < 0) return 1
  let level = 1
  for (const entry of LEVEL_CURVE) {
    if (totalXp < entry.cumulativeXp) {
      break
    }
    level = Math.min(entry.level + 1, LEVEL_CAP)
  }
  return level
}

const CHARACTER_QUERY = `
  query CharactersByAuthority($authority: String!) {
    allCharacters(condition: { authority: $authority }) {
      nodes {
        pubkey
        authority
        civilization
        civilizationCharacterId
        nftMint
        stats
        energy
        attributes
        currentQuest
        currentRecipe
        lastEnergyRefill
        experience
      }
    }
  }
`

const CHARACTER_BY_MINT_QUERY = `
  query CharacterByMint($mint: String!) {
    characterByNftMint(nftMint: $mint) {
      pubkey
      authority
      civilization
      civilizationCharacterId
      nftMint
      stats
      energy
      attributes
      currentQuest
      currentRecipe
      lastEnergyRefill
      experience
    }
  }
`

const CODEX_QUERY = `
  query CodexData {
    allCodexEquipments {
      nodes {
        idx
        displayName
        category
        allowedSlots
        occupiesBothHands
        occupiesForearm
        levelRequired
        attributeBonus
        raw
      }
    }
    allCodexQuests {
      nodes {
        id
        questType
        name
        displayName
        levelRequired
        cooldownSeconds
        baseEnergyCost
        minimumStats
        rewards
        raw
      }
    }
    allCodexRecipes {
      nodes {
        id
        recipeType
        name
        displayName
        levelRequired
        cooldownSeconds
        baseEnergyCost
        minimumStats
        input
        output
        raw
      }
    }
    allCodexResourceMints {
      nodes {
        resourceId
        resource
        displayName
        mint
        raw
      }
    }
  }
`

export async function fetchCharactersForAuthority(authority: string): Promise<CharacterRecord[]> {
  const res = await fetch(INDEXER_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: CHARACTER_QUERY, variables: { authority } })
  })
  if (!res.ok) {
    throw new Error(`Indexer error: ${res.status}`)
  }

  const json = await res.json()
  if (json?.errors) {
    console.error('Indexer GraphQL errors', json.errors)
  }
  const nodes: CharacterRecord[] = json?.data?.allCharacters?.nodes ?? []
  return nodes
}

export async function fetchCharacterMetadata(
  civilization: string,
  civilizationCharacterId: number
): Promise<
  | {
      name?: string
      image?: string
      description?: string
      attributes?: { trait_type?: string; value?: string | number }[]
    }
  | undefined
> {
  const slug = civilization.toLowerCase()
  const url = `https://mints.playarising.com/${slug}/${civilizationCharacterId}`
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    return res.json()
  } catch {
    return undefined
  }
}

export async function fetchCharacterByMint(mint: string): Promise<CharacterRecord | null> {
  const res = await fetch(INDEXER_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: CHARACTER_BY_MINT_QUERY, variables: { mint } })
  })
  if (!res.ok) {
    throw new Error(`Indexer error: ${res.status}`)
  }
  const json = await res.json()
  if (json?.errors) {
    console.error('Indexer GraphQL errors', json.errors)
  }
  const node = json?.data?.characterByNftMint as CharacterRecord | null | undefined
  return node ?? null
}

export async function fetchCodex(): Promise<{
  equipments: CodexEquipment[]
  quests: CodexQuest[]
  recipes: CodexRecipe[]
  resourceMints: CodexResourceMint[]
}> {
  const res = await fetch(INDEXER_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: CODEX_QUERY })
  })

  if (!res.ok) {
    throw new Error(`Indexer error: ${res.status}`)
  }

  const json = await res.json()
  if (json?.errors) {
    console.error('Indexer GraphQL errors', json.errors)
  }

  return {
    equipments: (json?.data?.allCodexEquipments?.nodes ?? []) as CodexEquipment[],
    quests: (json?.data?.allCodexQuests?.nodes ?? []) as CodexQuest[],
    recipes: (json?.data?.allCodexRecipes?.nodes ?? []) as CodexRecipe[],
    resourceMints: (json?.data?.allCodexResourceMints?.nodes ?? []) as CodexResourceMint[]
  }
}
