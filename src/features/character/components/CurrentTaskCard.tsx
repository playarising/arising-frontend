'use client'

import { Box, Button, Flex, Progress, Stack, Text } from '@chakra-ui/react'
import type { JSX } from 'react'
import { ModuleLoader } from './ModuleLoader'
import { formatDuration, type ProgressState } from '@/features'

type CurrentTaskCardProps = {
  titleLines: string[]
  primaryLabel: string
  primaryContent: JSX.Element
  progress: ProgressState | null
  onClaim?: () => void
  claimLabel: string
  submitting?: boolean
}

export const CurrentTaskCard = ({
  titleLines,
  primaryLabel,
  primaryContent,
  progress,
  onClaim,
  claimLabel,
  submitting
}: CurrentTaskCardProps) => (
  <Box border="1px solid rgba(255,255,255,0.1)" borderRadius="md" padding={4} bg="rgba(255,255,255,0.02)" position="relative">
    <ModuleLoader loading={Boolean(submitting)} label="Processing..." />
    <Stack gap={3}>
      <Stack gap={0.5}>
        {titleLines.length
          ? titleLines.map((part, idx) => (
            <Text key={idx} color="gray.300" fontSize="sm">
              {part}
            </Text>
          ))
          : (
            <Text color="gray.300" fontSize="sm">
              Task
            </Text>
          )}
      </Stack>

      <Box>
        <Text color="gray.400" fontSize="xs" fontWeight="600" mb={1.5}>
          {primaryLabel}
        </Text>
        <Flex justifyContent="center">{primaryContent}</Flex>
      </Box>

      {progress ? (
        <>
          <Progress.Root
            shape="rounded"
            value={progress.percent}
            max={100}
            size="lg"
            width="full"
            paddingX={{ base: 2, sm: 4 }}
            paddingY={{ base: 1, sm: 2 }}
          >
            <Progress.Track background="custom-dark-primary">
              <Progress.Range background="custom-keppel" />
            </Progress.Track>
          </Progress.Root>

          <Stack gap={1} align="center">
            <Text color="gray.300" fontSize="sm" fontWeight="600">
              {progress.percent}%
            </Text>
            <Text color="gray.400" fontSize="xs">
              {progress.claimable ? 'Ready to claim' : `Ready in ${formatDuration(progress.remaining)}`}
            </Text>
          </Stack>
        </>
      ) : (
        <Text color="gray.400" fontSize="xs" textAlign="center">
          Progress unavailable
        </Text>
      )}

      {onClaim ? (
        <Button
          size="sm"
          background="custom-blue"
          color="black"
          fontWeight="700"
          _hover={{ bg: 'white', color: 'black' }}
          disabled={!progress?.claimable || submitting}
          opacity={progress?.claimable && !submitting ? 1 : 0.5}
          cursor={progress?.claimable && !submitting ? 'pointer' : 'not-allowed'}
          width="full"
          onClick={onClaim}
        >
          {submitting ? 'Submitting...' : claimLabel}
        </Button>
      ) : null}
    </Stack>
  </Box>
)
