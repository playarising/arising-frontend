'use client'

import { CivilizationSelector, Container } from '@/components'
import { CIVILIZATIONS, type ICivilizationData } from '@/content'
import { VStack } from '@chakra-ui/react'
import { useState } from 'react'

export default function Page() {
  const [civilization, setCivilization] = useState<ICivilizationData>(CIVILIZATIONS.ard)

  return (
    <Container>
      <VStack align="center" height="full" marginX="2" overflow="hidden" spaceX={5} zIndex={20}>
        <CivilizationSelector activeCivilization={civilization.id} setCivilization={setCivilization} />
      </VStack>
    </Container>
  )
}
