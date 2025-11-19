"use client"

import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  calculateAttributePointAvailability,
  calculateCorePointAvailability,
  resolveCivilizationIndex
} from '../utils/progression'
import { allocateAttributesIx, allocateCoreStatsIx, findCharacterPda } from '@/lib/arising'
import type { AttributesInput, CoreStatsInput } from '@/lib/arising'
import { ModuleLoader } from './ModuleLoader'

const CORE_KEYS = ['might', 'speed', 'intellect'] as const
const ATTRIBUTE_KEYS = ['atk', 'def', 'mag_atk', 'mag_def', 'range', 'rate'] as const

const LABEL_MAP: Record<string, string> = {
  might: 'Might',
  speed: 'Speed',
  intellect: 'Intellect',
  atk: 'Attack',
  def: 'Defense',
  mag_atk: 'Mag Atk',
  mag_def: 'Mag Def',
  range: 'Range',
  rate: 'Rate'
}

type StatAllocationListProps = {
  civilization: string
  civilizationCharacterId: number
  level: number
  stats: Record<string, number>
  type: 'core' | 'attribute'
}

export function StatAllocationList({
  civilization,
  civilizationCharacterId,
  level,
  stats,
  type
}: StatAllocationListProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const router = useRouter()
  const [pending, setPending] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const availability = useMemo(() => {
    if (type === 'core') {
      return calculateCorePointAvailability(level, civilization, stats)
    }
    return calculateAttributePointAvailability(level, civilization, stats)
  }, [type, level, civilization, stats])

  const keys = type === 'core' ? CORE_KEYS : ATTRIBUTE_KEYS

  const pendingTotal = useMemo(
    () => Object.values(pending).reduce((total, value) => total + value, 0),
    [pending]
  )
  const remainingAvailable = Math.max(0, availability.available - pendingTotal)
  const baseMap = availability.base as Record<string, number>

  useEffect(() => {
    setPending({})
  }, [civilization, level, type, stats])

  const increment = (key: string) => {
    if (remainingAvailable <= 0 || submitting) return
    setPending((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
  }

  const decrement = (key: string) => {
    if (submitting) return
    setPending((prev) => {
      const current = prev[key] ?? 0
      if (current <= 0) return prev
      const updated = { ...prev, [key]: current - 1 }
      if (updated[key] === 0) delete updated[key]
      return updated
    })
  }

  const formatValue = (key: string) => {
    const baseValue = stats[key] ?? baseMap[key] ?? 0
    const pendingValue = pending[key] ?? 0
    return baseValue + pendingValue
  }

  const buildCoreAllocation = (): CoreStatsInput => ({
    might: pending.might ?? 0,
    speed: pending.speed ?? 0,
    intellect: pending.intellect ?? 0
  })

  const buildAttributeAllocation = (): AttributesInput => ({
    atk: pending.atk ?? 0,
    def: pending.def ?? 0,
    mag_atk: pending.mag_atk ?? 0,
    mag_def: pending.mag_def ?? 0,
    range: pending.range ?? 0,
    rate: pending.rate ?? 0
  })

  const handleSpend = async () => {
    if (!publicKey || !signTransaction || pendingTotal <= 0 || submitting) return
    try {
      setSubmitting(true)
      const civIndex = resolveCivilizationIndex(civilization)
      const characterPda = findCharacterPda(civIndex, civilizationCharacterId)
      const allocation =
        type === 'core' ? buildCoreAllocation() : buildAttributeAllocation()
      const ix =
        type === 'core'
          ? allocateCoreStatsIx(
              { civilization: civIndex, characterId: civilizationCharacterId, allocation },
              { character: characterPda, authority: publicKey }
            )
          : allocateAttributesIx(
              { civilization: civIndex, characterId: civilizationCharacterId, allocation },
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
      setPending({})
      router.refresh()
    } catch (error) {
      console.error('Failed to allocate points:', error)
      alert(`Failed to allocate points: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box position="relative" width="full">
      <ModuleLoader loading={submitting} label="Allocating points..." />
      <Stack gap={2} width="full">
        {keys.map((key) => {
        const pendingValue = pending[key] ?? 0
        const showIncrement = remainingAvailable > 0
        const showDecrement = pendingValue > 0
        return (
          <Flex
            key={key}
            align="center"
            justify="space-between"
            paddingY={1}
            gap={3}
            flexWrap="wrap"
          >
            <Text color="white" fontWeight="700">
              {LABEL_MAP[key] ?? key}
            </Text>
            <Flex align="center" gap={2}>
              <Text color="gray.200" minW="32px" textAlign="right">
                {formatValue(key)}
              </Text>
              <Flex align="center" gap={1}>
                {showDecrement ? (
                  <Box
                    as="button"
                    aria-label={`Remove ${LABEL_MAP[key] ?? key}`}
                    border="1px solid rgba(255,255,255,0.35)"
                    borderRadius="full"
                    width="26px"
                    height="26px"
                    display="grid"
                    placeItems="center"
                    color="white"
                    background="rgba(255,255,255,0.08)"
                    _hover={{ bg: 'white', color: 'black' }}
                    onClick={() => decrement(key)}
                  >
                    −
                  </Box>
                ) : null}
                {showIncrement ? (
                  <Box
                    as="button"
                    aria-label={`Increase ${LABEL_MAP[key] ?? key}`}
                    border="1px solid rgba(255,255,255,0.35)"
                    borderRadius="full"
                    width="26px"
                    height="26px"
                    display="grid"
                    placeItems="center"
                    color="white"
                    background="rgba(255,255,255,0.08)"
                    _hover={{ bg: 'white', color: 'black' }}
                    cursor="pointer"
                    onClick={() => increment(key)}
                  >
                    +
                  </Box>
                ) : null}
              </Flex>
            </Flex>
          </Flex>
        )
      })}
      <Stack gap={1} align="center" width="full">
        {remainingAvailable > 0 ? (
          <Text color="white" fontWeight="700" fontSize="sm">
            {remainingAvailable} points available
          </Text>
        ) : null}
        <Button
          size="sm"
          background="custom-blue"
          color="black"
          fontWeight="700"
          _hover={{ bg: 'white', color: 'black' }}
          disabled={pendingTotal === 0 || submitting || !publicKey || !signTransaction}
          width="full"
          onClick={handleSpend}
        >
          {submitting ? 'Submitting...' : 'Spend points'}
        </Button>
      </Stack>
      </Stack>
    </Box>
  )
}
