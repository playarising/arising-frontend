import { Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, fetchCharacterMetadata, fetchCharactersForAuthority } from '@/lib'

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

  return (
    <Stack align="center" justify="center" minH="100vh" bg="black" paddingY={16} paddingX={6}>
      <Stack
        border="1px solid rgba(255,255,255,0.08)"
        bg="rgba(255,255,255,0.04)"
        padding={8}
        borderRadius="xl"
        maxW="720px"
        width="full"
        gap={4}
        align="center"
        textAlign="center"
      >
        <Text color="white" fontWeight="700" fontSize={{ base: 'xl', md: '2xl' }}>
          Character Overview
        </Text>
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
        {metadata?.name && (
          <Text color="gray.100" fontWeight="700" fontSize="xl">
            {metadata.name}
          </Text>
        )}
        <Text color="gray.300" fontSize="sm">
          Civilization: {character.civilization} · ID: {character.civilizationCharacterId}
        </Text>
        <Text color="gray.300" fontSize="sm">
          Mint: {mint}
        </Text>
        {metadata?.description && (
          <Text color="gray.400" fontSize="sm">
            {metadata.description}
          </Text>
        )}
      </Stack>
    </Stack>
  )
}
