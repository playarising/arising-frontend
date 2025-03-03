'use client'

import { ClientOnly } from '@chakra-ui/react'
import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { sonic } from 'viem/chains'
import { WagmiProvider } from 'wagmi'

export const WAGMI_CONFIG = getDefaultConfig({
  appName: 'Arising: A Twirl Of Destinies',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sonic],
  ssr: true
})

const QUERY_CLIENT = new QueryClient()

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={WAGMI_CONFIG}>
      <QueryClientProvider client={QUERY_CLIENT}>
        <ClientOnly>
          <RainbowKitProvider theme={darkTheme()} modalSize="compact">
            {children}
          </RainbowKitProvider>
        </ClientOnly>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
