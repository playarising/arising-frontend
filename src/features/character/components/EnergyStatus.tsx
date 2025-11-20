"use client"

import { Box, Button, Flex, Progress, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { findCharacterPda, refillEnergyIx } from '@/lib'
import { resolveCivilizationIndex } from '@/features'
import { ModuleLoader } from './ModuleLoader'

type Props = {
  energy: number
  maxEnergy: number
  nextRefillEpochSeconds: number
  civilization: string
  civilizationCharacterId: number
}

export function EnergyStatus({
  energy,
  maxEnergy,
  nextRefillEpochSeconds,
  civilization,
  civilizationCharacterId
}: Props) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const router = useRouter()
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const refillAvailable = energy < maxEnergy && nowSeconds >= nextRefillEpochSeconds
  const countdownSeconds = Math.max(0, nextRefillEpochSeconds - nowSeconds)
  const energyPercent =
    energy !== undefined && maxEnergy ? Math.max(0, Math.min(100, Math.round((energy / maxEnergy) * 100))) : 0

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

  const handleRefill = async () => {
    if (!refillAvailable || submitting || !publicKey || !signTransaction) return
    try {
      setSubmitting(true)
      const civIndex = resolveCivilizationIndex(civilization)
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)
      const ix = refillEnergyIx(
        { civilization: civIndex, characterId: civilizationCharacterId },
        { character: characterPda, authority: publicKey }
      )
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const computeIxs = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
      ]
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...computeIxs, ix)
      const signed = await signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })
      router.refresh()
    } catch (error) {
      console.error('Failed to refill energy:', error)
      alert(`Failed to refill energy: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box position="relative" width="full">
      <ModuleLoader loading={submitting} label="Refilling energy..." />
      <Stack gap={2} align="center" width="full">
        <Stack width="full" maxW={{ base: 'full', sm: '320px' }} gap={1}>
          <Flex width="full" justify="space-between" align="center">
            <Text color="gray.400" fontSize="xs" fontWeight="600">
              Energy
            </Text>
            <Text color="gray.100" fontSize="xs" fontWeight="700">
              {energy.toLocaleString()} / {maxEnergy.toLocaleString()}
            </Text>
          </Flex>
          <Progress.Root
            shape="rounded"
            value={Math.max(0, Math.min(energy, maxEnergy))}
            max={maxEnergy}
            size="lg"
            width="full"
            paddingX={4}
            paddingY={2}
          >
            <Progress.Track background="custom-dark-primary">
              <Progress.Range background="custom-keppel" />
            </Progress.Track>
          </Progress.Root>
          <Text color="gray.500" fontSize="xs">
            {energyPercent}% full
          </Text>
        </Stack>
        <Button
          size="sm"
          background="custom-blue"
          color="black"
          fontWeight="700"
          _hover={{ bg: 'white', color: 'black' }}
          cursor={refillAvailable && !submitting ? 'pointer' : 'not-allowed'}
          disabled={!refillAvailable || submitting || !publicKey || !signTransaction}
          width={{ base: 'full', sm: 'auto' }}
          onClick={handleRefill}
        >
          {submitting ? 'Refilling...' : refillAvailable ? 'Refill Energy' : 'Refill available in'}
        </Button>
        {!refillAvailable && (
          <Text color="gray.400" fontSize="xs">
            {formatDuration(countdownSeconds)}
          </Text>
        )}
      </Stack>
    </Box>
  )
}
