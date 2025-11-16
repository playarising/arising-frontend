'use client'

import { Box, Button, Flex, HStack, Spinner, Stack, Text } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { AppLink } from '../navigation'
import { fetchCharactersForAuthority } from '@/lib'

export function SiteHeader() {
  const { connected, disconnect, publicKey, signMessage } = useWallet()

  const { data: session, status: sessionStatus } = useSession()

  const signing = useRef(false)
  const [signingIn, setSigningIn] = useState(false)
  const [hasCharacters, setHasCharacters] = useState(false)
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  const [showMintInfo, setShowMintInfo] = useState(false)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (sessionStatus === 'authenticated' && pathname === '/') {
      router.replace('/play')
    }
  }, [pathname, router, sessionStatus])

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (!connected || !publicKey) {
      signing.current = false
      setSigningIn(false)
      return
    }

    const walletAddress = publicKey.toBase58()
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
  }, [connected, disconnect, publicKey, router, session?.user?.address, sessionStatus, signMessage])

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

  const isAuthed = Boolean(session?.user?.address)

  return (
    <Stack as="header" margin="0 !important" position="absolute" top={0} width="full" zIndex="100">
      {showMintInfo && (
        <Box
          position="fixed"
          inset={0}
          backgroundColor="rgba(0, 0, 0, 0.82)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding={4}
          onClick={() => setShowMintInfo(false)}
        >
          <Box
            bg="black"
            border="1px solid rgba(255,255,255,0.1)"
            borderRadius="md"
            padding={5}
            maxW="520px"
            color="gray.200"
            onClick={(e) => e.stopPropagation()}
          >
            <Text color="white" fontWeight="700" marginBottom={3}>
              Mint Instructions
            </Text>
            <Text fontSize="sm" lineHeight="tall">
              Connect your wallet, choose a civilization on the play page, and click &quot;Mint Character&quot;. The mint requires the
              program authority co-signature, which we request automatically when you submit.
            </Text>
            <Button marginTop={4} size="sm" onClick={() => setShowMintInfo(false)}>
              Close
            </Button>
          </Box>
        </Box>
      )}
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
          <AppLink href="/">
            <Image alt="Arising Logo Top" height="768" src="/assets/logo-top.webp" width="484" priority />
          </AppLink>
        </Flex>

        {isAuthed && (
          <HStack>
            {hasCharacters && (
              <Button
                onClick={() => setShowMintInfo(true)}
                background="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                size="sm"
                loading={loadingCharacters}
              >
                <Text fontWeight="600">Mint instructions</Text>
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
