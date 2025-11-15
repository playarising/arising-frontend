'use client'

import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus'
import { clusterApiUrl } from '@solana/web3.js'
import { SessionProvider } from 'next-auth/react'
import { type ReactNode, useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

import { ThemeProvider } from './Theme'

export function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl(WalletAdapterNetwork.Mainnet), [])

  const wallets = useMemo(() => {
    const configured = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new TorusWalletAdapter()
    ]

    // Ensure unique wallet names to avoid duplicate key warnings from the modal
    const seen = new Set<string>()
    return configured.filter((wallet) => {
      if (seen.has(wallet.name)) return false
      seen.add(wallet.name)
      return true
    })
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
