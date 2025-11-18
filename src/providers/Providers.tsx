'use client'

import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus'
import { SessionProvider } from 'next-auth/react'
import { type ReactNode, useMemo } from 'react'
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
