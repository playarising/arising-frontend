'use client'

import { Buffer } from 'node:buffer'
import { Box, Button, CloseButton, chakra, IconButton, Progress, Spinner, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ComputeBudgetProgram, PublicKey, Transaction } from '@solana/web3.js'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { AppLink } from '@/components'
import {
  findCharacterMintPda,
  findCharacterPda,
  findCharacterTokenPda,
  findMintStatePda,
  levelFromExperience,
  mintCharacterIx,
  OPEN_MINT_MODAL_EVENT,
  TOKEN_METADATA_PROGRAM_ID,
  type Gender
} from '@/lib'
import { type CharacterWithMetadata, fetchCharacterMetadata, fetchCharactersForAuthority } from '@/lib/characters'

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

const CIV_LORE: Record<(typeof CIVS)[number], { summary: string; classes: string[] }> = {
  Ard: {
    summary:
      'Human war-culture of Rhuvonor whose cities are built around arenas and seasonal wars. Ard live to “dance with the goddess” in duels and campaigns, turning every craft and tradition toward perfecting the art of battle.',
    classes: ['Knight — a shielded bulwark on the front line.', 'Templar — a holy blade that blends faith and steel.']
  },
  Hartenn: {
    summary:
      'Short, heavily furred folk of Hartheim who carved warm fortress-cities into the frozen peaks of Tark. In their matriarchal society, eye color marks one’s calling, and endurance, community, and stubborn resilience are sacred virtues.',
    classes: [
      'Engineer — a tactician who fights with inventions.',
      'Warden — an immovable guardian who holds the line.'
    ]
  },
  "I'karan": {
    summary:
      'Ancient I’kara of Avos: persecuted shapeshifters whose true form is sinew and translucent skin, and whose chosen form is tall and elegant. They live in cities grown from colossal trees, mangrove ruins and stone bastions, hiding their faces behind masks that are only removed for trust… or for the kill.',
    classes: [
      'Ranger — a hunter-scout who strikes from range.',
      'Druid — a nature caster who bends the wilds to their will.'
    ]
  },
  Zhand: {
    summary:
      'Desert-hardened elves descended from exiled I’kara, now dwelling in the sands of Zhan. Organized in matriarchal clans, they raise acid-forged sand domes, revere water as sacred, and thrive as caravaners, trackers and traders across Rhuvonor’s harshest wastes.',
    classes: [
      'Sandblade — a swift duelist who dances through combat.',
      'Seer — a mystic who reads the dunes and spirits.'
    ]
  },
  Shinkari: {
    summary:
      'People of Akun, a continent of flowers, mountains and strict etiquette, where every gesture and word is shaped by ritual. After the last emperor’s death and the split between twin heirs, Shinkari clans vie for influence through trade, poetry and war, all bound by layered social codes.',
    classes: ['Samurai — a precise swordsman bound by code.', 'Onmyoji — a mage who commands spirits and talismans.']
  },
  "Tark'i": {
    summary:
      'Towering humans of the frozen continent of Tark, hardened by nine-month winters and lethal hunts. In close-knit villages they prize music, family and nights around the fire, but will raid sea and ice as hunters, pirates or mercenaries — even invoking the berserk Beniak trance — to keep their people alive.',
    classes: [
      'Raider — an agile skirmisher who raids and retreats.',
      'Skald — a battle bard whose songs empower allies.'
    ]
  }
}

const StyledSelect = chakra('select')

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
  const [gender, setGender] = useState<Gender>('Male')
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const [showMintModal, setShowMintModal] = useState(false)
  const hasCharacters = characters.length > 0
  const [fadeKey, setFadeKey] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  const changeIndex = (direction: 'next' | 'prev') => {
    if (!characters.length) return
    setDirection(direction === 'next' ? 1 : -1)
    setFadeKey((prev) => prev + 1)
    setCarouselIndex((prev) => {
      if (direction === 'next') return (prev + 1) % characters.length
      return (prev - 1 + characters.length) % characters.length
    })
  }

  const loadCharacters = useCallback(async (owner: string) => {
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
  }, [])

  useEffect(() => {
    if (!publicKey || !connected) {
      setCharacters([])
      return
    }
    loadCharacters(publicKey.toBase58())
  }, [connected, publicKey, loadCharacters])

  const handleMint = useCallback(async () => {
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
        { civilization: civIndex, characterId: nextId, gender },
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
      setShowMintModal(false)
      if (publicKey) {
        void loadCharacters(publicKey.toBase58())
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus({ state: 'error', message })
    }
  }, [connected, civilization, connection, gender, publicKey, setVisible, signTransaction, loadCharacters])

  useEffect(() => {
    const handleOpenMint = () => {
      setShowMintModal(true)
      setStatus({ state: 'idle' })
    }
    window.addEventListener(OPEN_MINT_MODAL_EVENT, handleOpenMint)
    return () => window.removeEventListener(OPEN_MINT_MODAL_EVENT, handleOpenMint)
  }, [])

  const mintSection = (options?: { onClose?: () => void; showCancel?: boolean }) => (
    <Stack
      bg="black"
      border="1px solid rgba(255,255,255,0.08)"
      borderRadius="lg"
      maxWidth="640px"
      padding={6}
      gap={4}
      width="full"
      alignItems="flex-start"
      boxShadow="0 10px 30px rgba(0,0,0,0.5)"
      position="relative"
    >
      {options?.onClose && (
        <CloseButton
          aria-label="Close mint modal"
          position="absolute"
          right={3}
          top={3}
          color="white"
          _hover={{ color: 'black', bg: 'white' }}
          onClick={options.onClose}
        />
      )}
      <Text color="white" fontSize="xl" fontWeight="700">
        Mint a Character
      </Text>
      <Text color="gray.300" fontSize="sm">
        {CIV_LORE[civilization].summary}
      </Text>
      <Text color="white" fontWeight="700" fontSize="sm">
        Class Paths
      </Text>
      <Stack as="ul" color="gray.200" fontSize="sm" gap={1} marginLeft={4}>
        {CIV_LORE[civilization].classes.map((item) => (
          <Box as="li" key={item}>
            {item}
          </Box>
        ))}
      </Stack>
      <Stack direction={{ base: 'column', sm: 'row' }} gap={3} width="full">
        <Box position="relative" width="full" maxW="260px">
          <StyledSelect
            bg="rgba(255,255,255,0.04)"
            borderColor="rgba(255,255,255,0.08)"
            color="white"
            value={civilization}
            onChange={(event) => setCivilization(event.target.value as (typeof CIVS)[number])}
            width="full"
            paddingX={3}
            paddingY={2}
            borderRadius="xl"
            cursor="pointer"
            pr={10}
            appearance="none"
          >
            {CIVS.map((civ) => (
              <option key={civ} value={civ}>
                {civ}
              </option>
            ))}
          </StyledSelect>
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
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
        </Box>
        <Box position="relative" width="full" maxW="260px">
          <StyledSelect
            bg="rgba(255,255,255,0.04)"
            borderColor="rgba(255,255,255,0.08)"
            color="white"
            value={gender}
            onChange={(event) => setGender(event.target.value === 'Female' ? 'Female' : 'Male')}
            width="full"
            paddingX={3}
            paddingY={2}
            borderRadius="xl"
            cursor="pointer"
            pr={10}
            appearance="none"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </StyledSelect>
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
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
        </Box>
      </Stack>
      <Stack direction={{ base: 'column', sm: 'row' }} gap={3} width="full">
        <Button
          background="custom-blue"
          color="black"
          fontWeight="700"
          disabled={status.state === 'submitting'}
          onClick={handleMint}
          _hover={{ bg: 'white', color: 'black' }}
          flex="1"
        >
          {status.state === 'submitting' ? 'Submitting…' : 'Mint Character'}
        </Button>
        {options?.showCancel && (
          <Button
            variant="outline"
            color="white"
            borderColor="rgba(255,255,255,0.2)"
            onClick={options.onClose}
            flex="1"
            _hover={{ bg: 'white', color: 'black', borderColor: 'white' }}
          >
            Cancel
          </Button>
        )}
      </Stack>
    </Stack>
  )

  return (
    <Stack
      align="center"
      bg="black"
      height="full"
      justify="center"
      minHeight="100vh"
      paddingY={12}
      paddingTop={28}
      gap={6}
      width="full"
      position="relative"
    >
      {loadingCharacters && (
        <Stack align="center" color="gray.300" gap={2}>
          <Spinner color="custom-blue" />
          <Text>Loading your characters…</Text>
        </Stack>
      )}

      {!loadingCharacters && hasCharacters && (
        <Stack
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="md"
          padding={4}
          maxWidth="760px"
          gap={3}
          bg="rgba(255,255,255,0.02)"
          alignItems="center"
          justifyContent="center"
          position="relative"
          minHeight="calc(100vh - 180px)"
        >
          <Box width="full" textAlign="center" top="3" position="absolute">
            <Text color="white" fontWeight="700" fontSize={{ base: 'xl', md: '2xl' }}>
              Your characters
            </Text>
          </Box>
          <Stack
            mt="7"
            direction={{ base: 'row', md: 'row' }}
            align="center"
            justify="space-between"
            gap={{ base: 2, md: 4 }}
            width="full"
          >
            <IconButton
              size="md"
              variant="ghost"
              color="white"
              onClick={() => changeIndex('prev')}
              alignSelf="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              aria-label="Previous character"
              _hover={{ opacity: 0.6, bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
              paddingX={2}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                <title>ChevronLeft</title>
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
            {characters[carouselIndex] &&
              (() => {
                const selected = characters[carouselIndex]
                const levelFromXp =
                  selected.experience !== undefined && selected.experience !== null
                    ? levelFromExperience(selected.experience)
                    : undefined
                const levelFromMetadata = selected.metadata?.attributes?.find(
                  (attr) => attr.trait_type === 'Level'
                )?.value
                const levelFromMetadataNumber =
                  typeof levelFromMetadata === 'number' ? levelFromMetadata : Number(levelFromMetadata ?? NaN)
                const resolvedLevelNumber =
                  Number.isFinite(levelFromXp) && levelFromXp
                    ? levelFromXp
                    : Number.isFinite(levelFromMetadataNumber)
                      ? levelFromMetadataNumber
                      : undefined
                const resolvedLevel = resolvedLevelNumber ?? levelFromMetadata ?? '—'
                const maxEnergy = resolvedLevelNumber ? 10 + (resolvedLevelNumber - 1) : undefined
                const currentEnergy = typeof selected.energy === 'number' ? selected.energy : undefined
                const energyPercent =
                  currentEnergy !== undefined && maxEnergy
                    ? Math.max(0, Math.min(100, Math.round((currentEnergy / maxEnergy) * 100)))
                    : undefined
                let parsedStats: Record<string, unknown> | null = null
                if (selected.stats) {
                  if (typeof selected.stats === 'string') {
                    try {
                      parsedStats = JSON.parse(selected.stats) as Record<string, unknown>
                    } catch {
                      parsedStats = null
                    }
                  } else if (typeof selected.stats === 'object') {
                    parsedStats = selected.stats
                  }
                }
                const statsEntries = parsedStats
                  ? (Object.entries(parsedStats).filter(([, value]) => typeof value === 'number') as Array<
                      [string, number]
                    >)
                  : []

                const variants = {
                  enter: (direction: 1 | -1) => ({
                    x: direction > 0 ? 60 : -60,
                    opacity: 0,
                    scale: 0.99
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1
                  },
                  exit: (direction: 1 | -1) => ({
                    x: direction > 0 ? -60 : 60,
                    opacity: 0,
                    scale: 0.99
                  })
                }

                return (
                  <Box width="full" overflow="hidden" maxW="600px" paddingX={{ base: 1, md: 2 }} minHeight="420px">
                    <AnimatePresence custom={direction} initial={false} mode="wait">
                      <motion.div
                        key={`${fadeKey}-${characters[carouselIndex].nftMint}`}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        style={{ width: '100%' }}
                      >
                        <Stack
                          align="center"
                          bg="rgba(0,0,0,0.4)"
                          borderRadius="xl"
                          padding={{ base: 4, md: 10 }}
                          gap={2}
                          textAlign="center"
                          width="full"
                        >
                          {selected.metadata?.image ? (
                            <Image
                              alt={selected.metadata?.name ?? 'Character image'}
                              src={selected.metadata?.image}
                              width={600}
                              height={340}
                              style={{ objectFit: 'contain', borderRadius: 16, width: '100%', maxHeight: 360 }}
                              unoptimized
                            />
                          ) : null}
                          <Text color="white" fontWeight="700">
                            {selected.metadata?.name ?? `${selected.civilization} #${selected.civilizationCharacterId}`}
                          </Text>
                          <Stack
                            direction="row"
                            flexWrap="wrap"
                            justify="center"
                            gap={3}
                            color="gray.300"
                            fontSize="sm"
                          >
                            <Text>
                              <Text as="span" fontWeight="700">
                                Level:
                              </Text>{' '}
                              {resolvedLevel}
                            </Text>
                            {statsEntries.map(([key, value]) => (
                              <Text key={key}>
                                <Text as="span" fontWeight="700">
                                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                                </Text>{' '}
                                {value}
                              </Text>
                            ))}
                          </Stack>
                          <Stack width="full" gap={2} align="center">
                            <Stack
                              direction="row"
                              justify="space-between"
                              color="gray.300"
                              fontSize="sm"
                              width={{ base: '90%', md: '60%' }}
                              maxW="420px"
                            >
                              <Text>Energy</Text>
                              <Text>{energyPercent !== undefined ? `${energyPercent}%` : '—'}</Text>
                            </Stack>
                            {currentEnergy !== undefined && maxEnergy ? (
                              <Progress.Root
                                shape="rounded"
                                value={currentEnergy}
                                max={maxEnergy}
                                size="lg"
                                width={{ base: '90%', md: '60%' }}
                                maxW="420px"
                                paddingX={4}
                                paddingY={2}
                              >
                                <Progress.Track background="custom-dark-primary">
                                  <Progress.Range background="custom-keppel" />
                                </Progress.Track>
                              </Progress.Root>
                            ) : null}
                            <Box width={{ base: '90%', md: '60%' }} maxW="420px">
                              <AppLink href={`/character/${selected.nftMint}`}>
                                <Button
                                  background="custom-blue"
                                  color="black"
                                  fontWeight="700"
                                  _hover={{ bg: 'white', color: 'black' }}
                                  width="100%"
                                  height="35px"
                                >
                                  Play
                                </Button>
                              </AppLink>
                            </Box>
                          </Stack>
                        </Stack>
                      </motion.div>
                    </AnimatePresence>
                  </Box>
                )
              })()}
            <IconButton
              size="md"
              variant="ghost"
              color="white"
              onClick={() => changeIndex('next')}
              aria-label="Next character"
              alignSelf="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _hover={{ opacity: 0.6, bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
              paddingX={2}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                <title>ChevronRight</title>
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
          </Stack>
        </Stack>
      )}

      {!loadingCharacters && !hasCharacters && mintSection()}

      {hasCharacters && showMintModal && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(0,0,0,0.9)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding={4}
          zIndex={2000}
          onClick={() => setShowMintModal(false)}
        >
          <Box onClick={(e) => e.stopPropagation()}>
            {mintSection({ onClose: () => setShowMintModal(false), showCancel: true })}
          </Box>
        </Box>
      )}
    </Stack>
  )
}
