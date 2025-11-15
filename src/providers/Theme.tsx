'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { CacheProvider } from '@emotion/react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { createEmotionCache } from '@/lib/emotion-cache'
import { SYSTEM } from '@/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const cache = useMemo(() => createEmotionCache(), [])

  return (
    <CacheProvider value={cache}>
      <ChakraProvider value={SYSTEM}>{children}</ChakraProvider>
    </CacheProvider>
  )
}
