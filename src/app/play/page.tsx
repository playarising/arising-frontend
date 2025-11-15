import { PageContainer } from '@/components'
import { PlayContent } from './PlayContent'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Play Arising',
  description: 'Jump into Arising gameplay once it is released.',
  alternates: { canonical: '/play' }
}

export default async function PlayPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.address) {
    redirect('/')
  }

  return (
    <PageContainer fallbackBackground="black" withBackground={false}>
      <PlayContent />
    </PageContainer>
  )
}
