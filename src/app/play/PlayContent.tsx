'use client'

import { Buffer } from 'node:buffer'
import { Box, Button, Stack, Text, chakra } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  type Connection,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js'
import { useState } from 'react'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  findMintStatePda,
  mintCharacterIx,
  TOKEN_METADATA_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@/lib/arising'

type Status =
  | { state: 'idle' }
  | { state: 'success'; signature: string }
  | { state: 'error'; message: string }
  | { state: 'submitting'; message: string }

const CIVS = ['Ard', 'Hartenn', 'Ikarans', 'Zhand', 'Shinkari', 'Tarki'] as const
const CIV_INDEX: Record<(typeof CIVS)[number], number> = {
  Ard: 0,
  Hartenn: 1,
  Ikarans: 2,
  Zhand: 3,
  Shinkari: 4,
  Tarki: 5
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

const deriveAta = (mint: PublicKey, owner: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0]

const u16le = (value: number) => {
  const buf = Buffer.alloc(2)
  buf.writeUInt16LE(value)
  return buf
}

// Guess at character PDA seeds: update if your program uses different seeds.
const deriveCharacterPda = (civilizationIndex: number, characterId: number, programId: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('character'), Buffer.from([civilizationIndex]), u16le(characterId)],
    programId
  )[0]

type MintState = {
  collectionMint: PublicKey
  collectionMetadata: PublicKey
  collectionMasterEdition: PublicKey
  nextIds: number[]
}

const parseMintState = (data: Buffer): MintState => {
  // Anchor adds 8-byte account discriminator.
  let offset = 8
  offset += 32 // authority
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

  return { collectionMint, collectionMetadata, collectionMasterEdition, nextIds }
}

const createMintAccountIx = async (connection: Connection, payer: PublicKey, mint: Keypair) => {
  const space = 82
  const lamports = await connection.getMinimumBalanceForRentExemption(space)
  return SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: mint.publicKey,
    lamports,
    space,
    programId: TOKEN_PROGRAM_ID
  })
}

const initializeMintIx = (mint: PublicKey, mintAuthority: PublicKey) => {
  const data = Buffer.alloc(67)
  data.writeUInt8(0, 0) // InitializeMint instruction
  data.writeUInt8(0, 1) // decimals = 0
  mintAuthority.toBuffer().copy(data, 2)
  data.writeUInt8(1, 34) // freeze authority present
  mintAuthority.toBuffer().copy(data, 35)

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ],
    data
  })
}

const createAtaIx = (payer: PublicKey, ata: PublicKey, owner: PublicKey, mint: PublicKey) =>
  new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ],
    data: Buffer.alloc(0)
  })

export function PlayContent() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  const { setVisible } = useWalletModal()

  const [civilization, setCivilization] = useState<(typeof CIVS)[number]>('Ard')
  const [status, setStatus] = useState<Status>({ state: 'idle' })

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

      const mint = Keypair.generate()
      const characterMint = mint.publicKey
      const characterTokenAccount = deriveAta(characterMint, publicKey)
      const characterAccount = deriveCharacterPda(civIndex, nextId, mintStatePda)
      const metadata = deriveMetadataPda(characterMint)
      const masterEdition = deriveMasterEditionPda(characterMint)

      const createMintIx = await createMintAccountIx(connection, publicKey, mint)
      const initMintIx = initializeMintIx(characterMint, publicKey)
      const createAta = createAtaIx(publicKey, characterTokenAccount, publicKey, characterMint)

      const mintIx = mintCharacterIx(
        { civilization: civIndex, characterId: nextId, gender: 'Male' },
        {
          character: characterAccount,
          authority: publicKey,
          mintAuthority: publicKey,
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

      const tx = new Transaction().add(createMintIx, initMintIx, createAta, mintIx)
      const signature = await sendTransaction(tx, connection, { signers: [mint] })
      setStatus({ state: 'success', signature })
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

        <Text color="gray.300" fontSize="sm">
          Pick a civilization and we handle the rest: fetch next id from on-chain mint state, derive PDAs, create the
          mint + ATA, and send the mint_character instruction.
        </Text>

        <CivSelect
          bg="rgba(255,255,255,0.04)"
          borderColor="rgba(255,255,255,0.08)"
          color="white"
          value={civilization}
          onChange={(event) => setCivilization(event.target.value as (typeof CIVS)[number])}
          maxW="260px"
          paddingX={3}
          paddingY={2}
          borderRadius="md"
        >
          {CIVS.map((civ) => (
            <option key={civ} value={civ}>
              {civ}
            </option>
          ))}
        </CivSelect>

        {status.state === 'error' && (
          <Box borderRadius="md" bg="rgba(255,0,0,0.08)" color="white" padding={3} border="1px solid rgba(255,0,0,0.24)">
            <Text>{status.message}</Text>
          </Box>
        )}

        {status.state === 'success' && (
          <Box
            borderRadius="md"
            bg="rgba(0,255,0,0.08)"
            color="white"
            padding={3}
            border="1px solid rgba(0,255,0,0.24)"
          >
            <Text>
              Submitted. Signature:{' '}
              <Text as="span" fontFamily="mono">
                {status.signature}
              </Text>
            </Text>
          </Box>
        )}

        {status.state === 'submitting' && (
          <Box
            borderRadius="md"
            bg="rgba(255,255,255,0.05)"
            color="white"
            padding={3}
            border="1px solid rgba(255,255,255,0.16)"
          >
            <Text>{status.message}</Text>
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
