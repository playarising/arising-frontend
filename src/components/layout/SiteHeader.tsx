'use client'

import { Box, Button, Flex, HStack, Spinner, Stack, Text } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { dispatchOpenMintModal, fetchCharactersForAuthority } from '@/lib'
import { AppLink } from '../navigation'

export function SiteHeader() {
  const { connected, disconnect, publicKey, signMessage } = useWallet()

  const { data: session, status: sessionStatus } = useSession()

  const signing = useRef(false)
  const loggingOut = useRef(false)
  const [signingIn, setSigningIn] = useState(false)
  const [hasCharacters, setHasCharacters] = useState(false)
  const [loadingCharacters, setLoadingCharacters] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey])

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (!connected || !publicKey) {
      signing.current = false
      setSigningIn(false)
      return
    }

    const sessionAddress = session?.user?.address

    if (sessionAddress === walletAddress) return
    if (signing.current) return

    let cancelled = false
    signing.current = true
    setSigningIn(true)

    const signConnectionMessage = async () => {
      try {
        if (!signMessage) {
          throw new Error('Wallet does not support message signing')
        }

        const nonce = (() => {
          if (typeof crypto !== 'undefined') {
            if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
            if (typeof crypto.getRandomValues === 'function') {
              const bytes = new Uint8Array(16)
              crypto.getRandomValues(bytes)
              return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
            }
          }
          return Math.random().toString(36).slice(2)
        })()

        const issuedAt = new Date().toISOString()
        const message = `Sign in to Arising\nWallet: ${walletAddress}\nNonce: ${nonce}\nIssued At: ${issuedAt}`
        const encodedMessage = new TextEncoder().encode(message)
        const signed = await signMessage(encodedMessage)

        if (cancelled) return

        const result = await signIn('solana', {
          publicKey: walletAddress,
          signature: bs58.encode(signed),
          message,
          nonce,
          redirect: false
        })

        if (!result || result.error || result.ok === false) {
          throw new Error(result?.error ?? 'Unknown authentication error')
        }

        router.replace('/play')
      } catch (error) {
        console.error('Wallet signature/auth failed, disconnecting', error)
        if (!cancelled) {
          try {
            await disconnect()
          } catch (disconnectError) {
            console.error('Error disconnecting after failed signature', disconnectError)
          }
        }
      } finally {
        signing.current = false
        setSigningIn(false)
      }
    }

    void signConnectionMessage()

    return () => {
      cancelled = true
    }
  }, [connected, disconnect, walletAddress, router, session?.user?.address, sessionStatus, signMessage, publicKey])

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      loggingOut.current = false
      return
    }
    if (connected && walletAddress) return
    if (loggingOut.current) return
    loggingOut.current = true

    const forceLogout = async () => {
      try {
        await signOut({ callbackUrl: '/', redirect: false })
      } catch (error) {
        console.error('Forced sign-out failed', error)
      } finally {
        loggingOut.current = false
        router.replace('/')
      }
    }

    void forceLogout()
  }, [connected, walletAddress, router, sessionStatus])

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return
    const sessionAddress = session?.user?.address
    if (!sessionAddress || !walletAddress) return
    if (sessionAddress === walletAddress) return
    if (loggingOut.current) return
    loggingOut.current = true

    const resetSession = async () => {
      try {
        await signOut({ callbackUrl: '/', redirect: false })
      } catch (error) {
        console.error('Failed to reset session on wallet change', error)
      } finally {
        loggingOut.current = false
      }
    }

    void resetSession()
  }, [session?.user?.address, sessionStatus, walletAddress])

  useEffect(() => {
    const authority = session?.user?.address
    if (!authority) {
      setHasCharacters(false)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        setLoadingCharacters(true)
        const chars = await fetchCharactersForAuthority(authority)
        if (!cancelled) setHasCharacters((chars?.length ?? 0) > 0)
      } catch (error) {
        console.error('Failed to load characters for header', error)
        if (!cancelled) setHasCharacters(false)
      } finally {
        if (!cancelled) setLoadingCharacters(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [session?.user?.address])

  const handleSignOut = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet on sign out', error)
    } finally {
      const result = await signOut({ callbackUrl: '/', redirect: false })
      if (result?.url) {
        router.replace(result.url)
      } else {
        router.replace('/')
      }
    }
  }

  const handleMintClick = () => {
    if (pathname !== '/play') {
      router.push('/play')
      return
    }
    dispatchOpenMintModal()
  }

  const isAuthed = Boolean(session?.user?.address)

  return (
    <Stack as="header" margin="0 !important" position="absolute" top={0} width="full" zIndex="100">
      {signingIn && (
        <Box
          position="fixed"
          inset={0}
          backgroundColor="rgba(0, 0, 0, 0.82)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Stack align="center" gap={4}>
            <Spinner color="custom-blue" size="xl" />
            <Text color="white" fontWeight="600">
              Finalizing sign-in…
            </Text>
          </Stack>
        </Box>
      )}
      <HStack align="center" justify="space-between" paddingX={{ base: 4, md: 10 }} paddingY={{ base: 3, md: 2 }}>
        <Flex alignItems="center" height="80px" width="40px">
          <AppLink href={isAuthed ? '/play' : '/'}>
            <Image alt="Arising Logo Top" height="768" src="/assets/logo-top.webp" width="484" priority />
          </AppLink>
        </Flex>

        {isAuthed && (
          <HStack>
            {hasCharacters && !pathname?.startsWith('/character') && (
              <Button
                onClick={handleMintClick}
                background="custom-blue"
                color="black"
                _hover={{ bg: 'white', color: 'black' }}
                size="sm"
                loading={loadingCharacters}
              >
                <Text fontWeight="600">Mint</Text>
              </Button>
            )}
            <Button
              onClick={handleSignOut}
              background="black"
              color="custom-blue"
              _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
              size="sm"
            >
              <Text fontWeight="600">Sign out</Text>
            </Button>
          </HStack>
        )}
      </HStack>
    </Stack>
  )
}
