import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { PageContainer } from '@/components'
import { authOptions } from '@/lib'
import { PlayContent } from './PlayContent'

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
