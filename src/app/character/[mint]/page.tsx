import { Box, Stack, Text } from '@chakra-ui/react'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, fetchCharacterByMint, fetchCharactersForAuthority } from '@/lib'

type Props = {
  params: { mint: string }
}

export default async function CharacterPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.address) {
    redirect('/play')
  }

  const [characterByMint, owned] = await Promise.all([
    fetchCharacterByMint(params.mint).catch(() => null),
    fetchCharactersForAuthority(session.user.address).catch(() => [])
  ])
  const ownedMatch = owned.find((c) => c.nftMint === params.mint)
  if (!characterByMint || !ownedMatch) {
    notFound()
  }

  const character = { ...characterByMint, ...ownedMatch }

  return (
    <Stack align="center" justify="center" minH="60vh" padding={8} gap={4}>
      <Box
        border="1px solid rgba(255,255,255,0.08)"
        bg="rgba(255,255,255,0.02)"
        padding={6}
        borderRadius="lg"
        maxW="640px"
        width="full"
      >
        <Text color="gray.300" fontSize="sm">
          Character Mint
        </Text>
        <Text color="white" fontWeight="700" fontSize="lg">
          {params.mint}
        </Text>
        <Text color="gray.300" fontSize="sm" mt={3}>
          Civilization: {character.civilization} · ID: {character.civilizationCharacterId}
        </Text>
      </Box>
    </Stack>
  )
}
