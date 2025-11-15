'use client'

import { Stack, VisuallyHidden } from '@chakra-ui/react'

export function PlayContent() {
  return (
    <Stack
      align="center"
      background="black"
      height="full"
      justify="center"
      minHeight="60vh"
      paddingY={12}
      gap={6}
      width="full"
      position="relative"
    >
      <VisuallyHidden>Play experience coming soon.</VisuallyHidden>
    </Stack>
  )
}
