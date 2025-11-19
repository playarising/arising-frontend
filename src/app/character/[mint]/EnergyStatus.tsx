'use client'

import { Button, Progress, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

type Props = {
  energy: number
  maxEnergy: number
  nextRefillEpochSeconds: number
}

export function EnergyStatus({ energy, maxEnergy, nextRefillEpochSeconds }: Props) {
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000))

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

  return (
    <Stack gap={2} align="center" width="full">
      <Stack
        direction="row"
        justify="space-between"
        color="gray.300"
        fontSize="sm"
        width="full"
        maxW={{ base: 'full', sm: '320px' }}
      >
        <Text>Energy</Text>
        <Text>{energyPercent}%</Text>
      </Stack>
      <Progress.Root
        shape="rounded"
        value={Math.max(0, Math.min(energy, maxEnergy))}
        max={maxEnergy}
        size="lg"
        width="full"
        maxW={{ base: 'full', sm: '320px' }}
        paddingX={4}
        paddingY={2}
      >
        <Progress.Track background="custom-dark-primary">
          <Progress.Range background="custom-keppel" />
        </Progress.Track>
      </Progress.Root>
      <Button
        size="sm"
        background="custom-blue"
        color="black"
        fontWeight="700"
        _hover={{ bg: 'white', color: 'black' }}
        cursor={refillAvailable ? 'pointer' : 'not-allowed'}
        disabled={!refillAvailable}
        width={{ base: 'full', sm: 'auto' }}
      >
        {refillAvailable ? 'Refill Energy' : 'Refill available in'}
      </Button>
      {!refillAvailable && (
        <Text color="gray.400" fontSize="xs">
          {formatDuration(countdownSeconds)}
        </Text>
      )}
    </Stack>
  )
}
