'use client'

import { Buffer } from 'node:buffer'
import { Box, Button, chakra, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ComputeBudgetProgram, PublicKey, Transaction } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import {
  findCharacterMintPda,
  findCharacterPda,
  findCharacterTokenPda,
  findMintStatePda,
  mintCharacterIx,
  TOKEN_METADATA_PROGRAM_ID
} from '@/lib'
import { fetchCharacterMetadata, fetchCharactersForAuthority, type CharacterWithMetadata } from '@/lib/characters'

type Status =
  | { state: 'idle' }
  | { state: 'success'; signature: string }
  | { state: 'error'; message: string }
  | { state: 'submitting'; message: string }

const CIVS = ['Ard', 'Hartenn', "I'karan", 'Zhand', 'Shinkari', "Tark'i"] as const

const CIV_INDEX: Record<(typeof CIVS)[number], number> = {
  Ard: 0,
  Hartenn: 1,
  "I'karan": 2,
  Zhand: 3,
  Shinkari: 4,
  "Tark'i": 5
}
const CivSelect = chakra('select')

const deriveMetadataPda = (mint: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )[0]

const deriveMasterEditionPda = (mint: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from('edition')],
    TOKEN_METADATA_PROGRAM_ID
  )[0]

type MintState = {
  authority: PublicKey
  collectionMint: PublicKey
  collectionMetadata: PublicKey
  collectionMasterEdition: PublicKey
  nextIds: number[]
}

const parseMintState = (data: Buffer): MintState => {
  // Anchor adds 8-byte account discriminator.
  let offset = 8
  const authority = new PublicKey(data.slice(offset, offset + 32))
  offset += 32
  offset += 1 // bump
  const collectionMint = new PublicKey(data.slice(offset, offset + 32))
  offset += 32
  const collectionMetadata = new PublicKey(data.slice(offset, offset + 32))
  offset += 32
  const collectionMasterEdition = new PublicKey(data.slice(offset, offset + 32))
  offset += 32
  offset += 32 // usdc_mint
  offset += 32 // usdc_treasury

  const nextIds: number[] = []
  for (let i = 0; i < 6; i += 1) {
    const nextId = data.readUInt16LE(offset)
    offset += 2
    offset += 2 // cap
    nextIds.push(nextId)
  }

  return { authority, collectionMint, collectionMetadata, collectionMasterEdition, nextIds }
}

export function PlayContent() {
  const { connection } = useConnection()
  const { publicKey, signTransaction, connected } = useWallet()
  const { setVisible } = useWalletModal()

  const [characters, setCharacters] = useState<CharacterWithMetadata[]>([])
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [civilization, setCivilization] = useState<(typeof CIVS)[number]>('Ard')
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const hasCharacters = characters.length > 0

  useEffect(() => {
    if (!publicKey || !connected) {
      setCharacters([])
      return
    }
    void loadCharacters(publicKey.toBase58())
  }, [connected, publicKey])

  const loadCharacters = async (owner: string) => {
    try {
      setLoadingCharacters(true)
      const base = await fetchCharactersForAuthority(owner)
      const withMeta: CharacterWithMetadata[] = await Promise.all(
        base.map(async (c) => {
          const metadata = await fetchCharacterMetadata(c.civilization, c.civilizationCharacterId)
          return { ...c, metadata }
        })
      )
      setCharacters(withMeta)
      setCarouselIndex(0)
    } catch (error) {
      console.error('Failed to load characters', error)
      setCharacters([])
    } finally {
      setLoadingCharacters(false)
    }
  }

  const handleMint = async () => {
    if (!publicKey || !connected) {
      setVisible(true)
      return
    }

    try {
      setStatus({ state: 'submitting', message: 'Preparing mint…' })

      const mintStatePda = findMintStatePda()
      const mintStateAccount = await connection.getAccountInfo(mintStatePda)
      if (!mintStateAccount) throw new Error('Mint state account not found on-chain')
      const mintState = parseMintState(Buffer.from(mintStateAccount.data))

      const civIndex = CIV_INDEX[civilization]
      const nextId = mintState.nextIds[civIndex] ?? 0

      const characterMint = findCharacterMintPda(civIndex, nextId)
      const characterTokenAccount = findCharacterTokenPda(civIndex, nextId)
      const characterAccount = findCharacterPda(civIndex, nextId)
      const metadata = deriveMetadataPda(characterMint)
      const masterEdition = deriveMasterEditionPda(characterMint)

      const mintIx = mintCharacterIx(
        { civilization: civIndex, characterId: nextId, gender: 'Male' },
        {
          character: characterAccount,
          authority: publicKey,
          mintAuthority: mintState.authority,
          mintState: mintStatePda,
          characterMint,
          characterTokenAccount,
          metadata,
          masterEdition,
          collectionMint: mintState.collectionMint,
          collectionMetadata: mintState.collectionMetadata,
          collectionMasterEdition: mintState.collectionMasterEdition
        }
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

      const computeIxs = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
      ]

      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash
      }).add(...computeIxs, mintIx)

      setStatus({ state: 'submitting', message: 'Requesting authority signature…' })
      const response = await fetch('/api/sign-mint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transaction: tx.serialize({ requireAllSignatures: false }).toString('base64') })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Authority signing failed')
      }

      const { signedTransaction } = (await response.json()) as { signedTransaction: string }
      const authoritySignedTx = Transaction.from(Buffer.from(signedTransaction, 'base64'))

      if (!signTransaction) throw new Error('Wallet does not support transaction signing')
      const fullySigned = await signTransaction(authoritySignedTx)

      const sig = await connection.sendRawTransaction(fullySigned.serialize())
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })

      setStatus({ state: 'success', signature: sig })
      if (publicKey) {
        void loadCharacters(publicKey.toBase58())
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus({ state: 'error', message })
    }
  }

  return (
    <Stack
      align="center"
      bg="black"
      height="full"
      justify="center"
      minHeight="60vh"
      paddingY={12}
      gap={6}
      width="full"
      position="relative"
    >
      <Stack
        bg="rgba(255,255,255,0.02)"
        border="1px solid rgba(255,255,255,0.08)"
        borderRadius="lg"
        maxWidth="640px"
        padding={6}
        gap={4}
        width="full"
        alignItems="flex-start"
      >
        <Text color="white" fontSize="xl" fontWeight="700">
          Mint a Character
        </Text>

        {!hasCharacters && (
          <Text color="gray.300" fontSize="sm">
            Pick a civilization and we handle the rest: fetch next id from on-chain mint state, derive program PDAs, and
            send the mint_character instruction (requires the mint authority wallet).
          </Text>
        )}

        <Box position="relative" width="full" maxW="260px">
          <CivSelect
            bg="rgba(255,255,255,0.04)"
            borderColor="rgba(255,255,255,0.08)"
            color="white"
            value={civilization}
            onChange={(event) => setCivilization(event.target.value as (typeof CIVS)[number])}
            width="full"
            paddingX={3}
            paddingY={2}
            borderRadius="md"
            pr={10}
            appearance="none"
          >
            {CIVS.map((civ) => (
              <option key={civ} value={civ}>
                {civ}
              </option>
            ))}
          </CivSelect>
          <Box
            aria-hidden
            pointerEvents="none"
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
            color="whiteAlpha.800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
              <title>ChevronDown</title>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
        </Box>

        {loadingCharacters && <Text color="gray.400">Loading your characters…</Text>}

        {!loadingCharacters && characters.length > 0 && (
          <Stack
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="md"
            padding={4}
            width="full"
            gap={3}
            bg="rgba(255,255,255,0.02)"
          >
            <Text color="white" fontWeight="700">
              Your characters
            </Text>
            <Stack direction={{ base: 'column', md: 'row' }} align="center" gap={4} width="full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCarouselIndex((prev) => (prev - 1 + characters.length) % characters.length)}
              >
                Prev
              </Button>
              {characters[carouselIndex] && (
                <Stack
                  align="center"
                  bg="rgba(0,0,0,0.4)"
                  borderRadius="md"
                  padding={4}
                  width="full"
                  maxW="420px"
                  gap={2}
                  textAlign="center"
                >
                  {characters[carouselIndex].metadata?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={characters[carouselIndex].metadata?.name ?? 'Character image'}
                      src={characters[carouselIndex].metadata?.image}
                      style={{ maxHeight: 220, objectFit: 'contain', borderRadius: 8, width: '100%' }}
                    />
                  ) : null}
                  <Text color="white" fontWeight="700">
                    {characters[carouselIndex].metadata?.name ??
                      `${characters[carouselIndex].civilization} #${characters[carouselIndex].civilizationCharacterId}`}
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    Civilization: {characters[carouselIndex].civilization} · ID: {characters[carouselIndex].civilizationCharacterId}
                  </Text>
                  {characters[carouselIndex].metadata?.description && (
                    <Text color="gray.400" fontSize="sm">
                      {characters[carouselIndex].metadata?.description}
                    </Text>
                  )}
                </Stack>
              )}
              <Button size="sm" variant="outline" onClick={() => setCarouselIndex((prev) => (prev + 1) % characters.length)}>
                Next
              </Button>
            </Stack>
          </Stack>
        )}

        {!loadingCharacters && characters.length === 0 && (
          <Box borderRadius="md" bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)" padding={4} color="white">
            Connect and mint your first character to see it here.
          </Box>
        )}

        <Button
          background="custom-blue"
          color="black"
          fontWeight="700"
          disabled={status.state === 'submitting'}
          onClick={handleMint}
          _hover={{ bg: 'white', color: 'black' }}
        >
          {status.state === 'submitting' ? 'Submitting…' : 'Mint Character'}
        </Button>
      </Stack>
    </Stack>
  )
}
