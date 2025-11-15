import { PageContainer } from '@/components'
import { Box, VisuallyHidden } from '@chakra-ui/react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play Arising',
  description: 'Jump into Arising gameplay once it is released.',
  alternates: { canonical: '/play' }
}

export default function PlayPage() {
  return (
    <PageContainer fallbackBackground="black" showFooter={false} withBackground={false}>
      <Box background="black" height="full" width="full">
        <VisuallyHidden>Play experience coming soon.</VisuallyHidden>
      </Box>
    </PageContainer>
  )
}
