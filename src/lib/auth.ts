import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import nacl from 'tweetnacl'

const MESSAGE_MAX_AGE_MS = 5 * 60 * 1000

function verifySignature(message: string, signature: string, publicKey: string) {
  try {
    const decodedSignature = bs58.decode(signature)
    const encodedMessage = new TextEncoder().encode(message)
    const solanaPublicKey = new PublicKey(publicKey)

    return nacl.sign.detached.verify(encodedMessage, decodedSignature, solanaPublicKey.toBytes())
  } catch (error) {
    console.error('Failed to verify signature', error)
    return false
  }
}

function messageHasNonce(message: string, nonce: string) {
  return message.includes(`Nonce: ${nonce}`)
}

function messageIsFresh(message: string) {
  const issuedAtMatch = message.match(/Issued At:\s*(.*)/i)
  if (!issuedAtMatch?.[1]) return false

  const issuedAt = Date.parse(issuedAtMatch[1].trim())
  if (Number.isNaN(issuedAt)) return false

  return Date.now() - issuedAt < MESSAGE_MAX_AGE_MS
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Solana',
      id: 'solana',
      credentials: {
        publicKey: { label: 'Public Key', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
        nonce: { label: 'Nonce', type: 'text' }
      },
      authorize(credentials) {
        if (!credentials?.publicKey || !credentials.signature || !credentials.message || !credentials.nonce) {
          return null
        }

        const matchesNonce = messageHasNonce(credentials.message, credentials.nonce)
        const isFresh = messageIsFresh(credentials.message)
        const signatureValid = verifySignature(credentials.message, credentials.signature, credentials.publicKey)

        if (!matchesNonce || !isFresh || !signatureValid) {
          return null
        }

        return {
          id: credentials.publicKey,
          name: 'Solana User',
          address: credentials.publicKey
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/',
    error: '/'
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.address = (user as { address?: string }).address
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.address = (token as { address?: string }).address
        session.user.id = token.sub
        session.user.name ??= 'Solana User'
      }

      return session
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    }
  },
  secret: process.env.NEXTAUTH_SECRET ?? 'development-secret'
}
