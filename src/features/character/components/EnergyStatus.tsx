'use client'

import { Box, Button, Flex, Progress, Stack, Text } from '@chakra-ui/react'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { resolveCivilizationIndex } from '@/features'
import {
  USDC_MINT_DEVNET,
  buyEnergyPassIx,
  findCharacterPda,
  findMintStatePda,
  redeemEnergyPassIx,
  refillEnergyIx
} from '@/lib'
import { ModuleLoader } from './ModuleLoader'

type Props = {
  energy: number
  maxEnergy: number
  nextRefillEpochSeconds: number
  civilization: string
  civilizationCharacterId: number
  energyPasses: {
    passes_owned?: number
    usage_in_window?: number
    usage_window_start?: number
    purchases_in_window?: number
    purchase_window_start?: number
  } | null
  showEnergy?: boolean
  showPasses?: boolean
}

export function EnergyStatus({
  energy,
  maxEnergy,
  nextRefillEpochSeconds,
  civilization,
  civilizationCharacterId,
  energyPasses,
  showEnergy = true,
  showPasses = true
}: Props) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const router = useRouter()
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000))
  const [submitting, setSubmitting] = useState<'refill' | 'buy' | 'redeem' | null>(null)

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

  const passesOwned = Math.max(0, Number(energyPasses?.passes_owned ?? 0))
  const purchasesInWindow = Math.max(0, Number(energyPasses?.purchases_in_window ?? 0))
  const usageInWindow = Math.max(0, Number(energyPasses?.usage_in_window ?? 0))
  const purchaseRemaining = Math.max(0, 5 - purchasesInWindow)
  const redeemRemaining = Math.max(0, Math.min(passesOwned, 3 - usageInWindow))

  const handleRefill = async () => {
    if (!refillAvailable || submitting || !publicKey || !signTransaction) return
    try {
      setSubmitting('refill')
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
      setSubmitting(null)
    }
  }

  const handleBuyPass = async () => {
    if (!publicKey || !signTransaction || purchaseRemaining <= 0) return
    try {
      setSubmitting('buy')
      const civIndex = resolveCivilizationIndex(civilization)
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)
      const mintState = findMintStatePda()
      const usdcMint = USDC_MINT_DEVNET
      const userUsdcAta = getAssociatedTokenAddressSync(usdcMint, publicKey)
      const treasuryAta = getAssociatedTokenAddressSync(usdcMint, mintState, true)

      const createUserAtaIx =
        (await connection.getAccountInfo(userUsdcAta)) === null
          ? createAssociatedTokenAccountInstruction(publicKey, userUsdcAta, publicKey, usdcMint)
          : null

      const buyIx = buyEnergyPassIx(
        { civilization: civIndex, characterId: civilizationCharacterId, quantity: 1 },
        {
          character: characterPda,
          authority: publicKey,
          mintState,
          userUsdcAccount: userUsdcAta,
          treasuryUsdcAccount: treasuryAta
        }
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const computeIxs = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
      ]

      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(
        ...computeIxs,
        ...(createUserAtaIx ? [createUserAtaIx] : []),
        buyIx
      )
      const signed = await signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })
      router.refresh()
    } catch (error) {
      console.error('Failed to buy energy pass:', error)
      alert(`Failed to buy energy pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(null)
    }
  }

  const handleRedeemPass = async () => {
    if (!publicKey || !signTransaction || redeemRemaining <= 0) return
    try {
      setSubmitting('redeem')
      const civIndex = resolveCivilizationIndex(civilization)
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)

      const ix = redeemEnergyPassIx(
        { civilization: civIndex, characterId: civilizationCharacterId },
        { character: characterPda, authority: publicKey }
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const computeIxs = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 })
      ]

      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...computeIxs, ix)
      const signed = await signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })
      router.refresh()
    } catch (error) {
      console.error('Failed to redeem energy pass:', error)
      alert(`Failed to redeem energy pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <Box position="relative" width="full">
      <ModuleLoader
        loading={Boolean(submitting)}
        label={
          submitting === 'buy'
            ? 'Purchasing pass...'
            : submitting === 'redeem'
              ? 'Redeeming pass...'
              : 'Refilling energy...'
        }
      />
      <Stack gap={3} align="center" width="full">
        {showEnergy && (
          <>
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
              disabled={!refillAvailable || Boolean(submitting) || !publicKey || !signTransaction}
              width={{ base: 'full', sm: 'auto' }}
              onClick={handleRefill}
            >
              {submitting === 'refill' ? 'Refilling...' : refillAvailable ? 'Refill Energy' : 'Refill available in'}
            </Button>
            {!refillAvailable && (
              <Text color="gray.400" fontSize="xs">
                {formatDuration(countdownSeconds)}
              </Text>
            )}
          </>
        )}
        {showPasses && (
          <Stack gap={3} width="full" align="center">
            <Stack
              gap={1}
              padding={3}
              border="1px solid rgba(255,255,255,0.08)"
              borderRadius="md"
              width="full"
              maxW="320px"
              bg="rgba(255,255,255,0.02)"
              textAlign="center"
              fontSize="sm"
              color="gray.200"
            >
              <Text fontWeight="700" color="white">
                Energy Passes
              </Text>
              <Text>Owned: {passesOwned}</Text>
              <Text>Purchases left (24h): {purchaseRemaining}/5</Text>
              <Text>Redeems left (24h): {redeemRemaining}/3</Text>
            </Stack>
            <Stack width="full" maxW="320px" gap={2}>
              <Button
                size="sm"
                background="custom-blue"
                color="black"
                fontWeight="700"
                _hover={{ bg: 'white', color: 'black' }}
                py={7}
                cursor={purchaseRemaining > 0 && !submitting ? 'pointer' : 'not-allowed'}
                disabled={purchaseRemaining <= 0 || Boolean(submitting) || !publicKey || !signTransaction}
                onClick={handleBuyPass}
              >
                {submitting === 'buy' ? (
                  'Purchasing...'
                ) : (
                  <>
                    Buy pass
                    <br />
                    (2 USDC)
                  </>
                )}
              </Button>
              <Button
                size="sm"
                background="custom-keppel"
                color="black"
                fontWeight="700"
                _hover={{ bg: 'white', color: 'black' }}
                cursor={redeemRemaining > 0 && !submitting ? 'pointer' : 'not-allowed'}
                disabled={redeemRemaining <= 0 || Boolean(submitting) || !publicKey || !signTransaction}
                onClick={handleRedeemPass}
              >
                {submitting === 'redeem' ? 'Redeeming...' : 'Use Energy Pass'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
