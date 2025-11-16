'use client'

import { ChakraProvider } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { SYSTEM } from '@/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={SYSTEM}>{children}</ChakraProvider>
}
