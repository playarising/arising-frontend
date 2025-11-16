import { NextResponse } from 'next/server'

const RPC_ENDPOINT =
  process.env.SOLANA_RPC_ENDPOINT ?? ''

export async function POST(request: Request) {
  if (!RPC_ENDPOINT) {
    return NextResponse.json(
      { error: 'RPC endpoint missing (set SOLANA_RPC_ENDPOINT)' },
      { status: 500 },
    )
  }

  try {
    const body = await request.text()
    const upstream = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
