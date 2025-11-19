'use client'

import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus'
import { SessionProvider } from 'next-auth/react'
import { type ReactNode, useEffect, useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import { ThemeProvider } from './Theme'

export function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_SOLANA_RPC
    if (configured && configured.trim().length > 0) return configured
    return clusterApiUrl(WalletAdapterNetwork.Devnet)
  }, [])

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new BackpackWalletAdapter(), new TorusWalletAdapter()], [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof performance === 'undefined' || typeof performance.measure !== 'function') {
      return
    }
      const originalMeasure = performance.measure.bind(performance)
      const safeMeasure: typeof performance.measure = (name, startMark, endMark) => {
        if (typeof startMark === 'string' && typeof endMark === 'string') {
          const startEntries = performance.getEntriesByName(startMark)
          const endEntries = performance.getEntriesByName(endMark)
          const startTime = startEntries[startEntries.length - 1]?.startTime
          const endTime = endEntries[endEntries.length - 1]?.startTime
          if (typeof startTime === 'number' && typeof endTime === 'number' && endTime < startTime) {
            return undefined as unknown as PerformanceMeasure
          }
        }
        try {
          return originalMeasure(name, startMark as any, endMark as any)
        } catch (error) {
          console.warn('Skipped performance.measure due to error:', error)
          return undefined as unknown as PerformanceMeasure
        }
      }
      performance.measure = safeMeasure
    return () => {
      performance.measure = originalMeasure
    }
  }, [])

  return (
    <ThemeProvider>
      <SessionProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider autoConnect wallets={wallets}>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
