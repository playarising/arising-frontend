import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Program gatekeeping: only sign mint_character calls for this program.
const ARISING_PROGRAM_ID = new PublicKey('arisf5D474u42BL55eCbDFgc5qA3LHGhgVdhCYQkgrM')
const MINT_CHARACTER_DISCRIMINATOR = Buffer.from([127, 29, 52, 229, 72, 194, 255, 67]) // from arising IDL

const secretKey = (() => {
  const raw = process.env.MINT_AUTHORITY_SECRET
  if (!raw) return undefined

  try {
    if (raw.trim().startsWith('[')) {
      const arr = JSON.parse(raw)
      return Keypair.fromSecretKey(Buffer.from(arr))
    }
    return Keypair.fromSecretKey(bs58.decode(raw.trim()))
  } catch (error) {
    console.error('Failed to parse MINT_AUTHORITY_SECRET', error)
    return undefined
  }
})()

const invalid = (message: string, status = 400) => NextResponse.json({ error: message }, { status })
const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey('ComputeBudget111111111111111111111111111111')

export async function POST(request: Request) {
  if (!secretKey) {
    return invalid('Signer not configured (set MINT_AUTHORITY_SECRET on the server)', 500)
  }

  let payload: { transaction: string }
  try {
    payload = await request.json()
  } catch {
    return invalid('Invalid JSON body')
  }

  if (!payload?.transaction || typeof payload.transaction !== 'string') {
    return invalid('Missing transaction (base64)')
  }

  let tx: Transaction
  try {
    const bytes = Buffer.from(payload.transaction, 'base64')
    tx = Transaction.from(bytes)
  } catch (error) {
    return invalid(`Unable to parse transaction: ${error instanceof Error ? error.message : 'unknown error'}`)
  }

  // Validate instructions: allow compute budget; require at least one mint_character; disallow everything else.
  let hasMint = false
  for (const ix of tx.instructions) {
    if (ix.programId.equals(COMPUTE_BUDGET_PROGRAM_ID)) {
      continue
    }
    if (ix.programId.equals(ARISING_PROGRAM_ID)) {
      const data = Buffer.from(ix.data)
      if (data.length >= 8 && data.subarray(0, 8).equals(MINT_CHARACTER_DISCRIMINATOR)) {
        hasMint = true
        continue
      }
    }
    return invalid('Transaction contains unsupported instructions')
  }

  if (!hasMint) {
    return invalid('Transaction is not a mint_character call to the Arising program')
  }

  try {
    tx.partialSign(secretKey)
    const signed = tx.serialize({ requireAllSignatures: false }).toString('base64')
    return NextResponse.json({
      signedTransaction: signed,
      signer: secretKey.publicKey.toBase58()
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown sign error'
    return invalid(`Failed to sign transaction: ${message}`, 500)
  }
}

export function GET() {
  return invalid('Method not allowed', 405)
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-origin': '*',
      'access-control-max-age': '86400'
    }
  })
}
