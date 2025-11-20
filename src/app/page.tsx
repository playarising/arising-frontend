import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { LandingPage, PageContainer } from '@/components'
import { authOptions } from '@/lib'

export const metadata: Metadata = {
  title: 'Arising - Web3 Roleplay RPG',
  description:
    'Join the first web3 roleplay community. Create your character, shape the fate of Etia, and engage in dynamic campaigns.',
  alternates: {
    canonical: 'https://playarising.com'
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.address) {
    redirect('/play')
  }

  return (
    <PageContainer>
      <LandingPage />
    </PageContainer>
  )
}
