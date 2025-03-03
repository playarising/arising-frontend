'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { SYSTEM } from '@/theme'
import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={SYSTEM}>
      <NextThemeProvider attribute="class" disableTransitionOnChange>
        {children}
      </NextThemeProvider>
    </ChakraProvider>
  )
}
