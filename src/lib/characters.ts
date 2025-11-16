const INDEXER_ENDPOINT = 'https://indexer.playarising.com/graphql'

export type CharacterRecord = {
  pubkey: string
  civilization: string
  civilizationCharacterId: number
  nftMint: string
}

export type CharacterWithMetadata = CharacterRecord & {
  metadata?: {
    name?: string
    image?: string
    description?: string
  }
}

const CHARACTER_QUERY = `
  query CharactersByAuthority($authority: String!) {
    allCharacters(condition: { authority: $authority }) {
      nodes {
        pubkey
        civilization
        civilizationCharacterId
        nftMint
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
  const nodes: CharacterRecord[] = json?.data?.allCharacters?.nodes ?? []
  return nodes
}

export async function fetchCharacterMetadata(
  civilization: string,
  civilizationCharacterId: number
): Promise<{ name?: string; image?: string; description?: string } | undefined> {
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
