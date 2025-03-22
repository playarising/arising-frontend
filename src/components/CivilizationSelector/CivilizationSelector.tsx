'use client'

import { CIVILIZATIONS, type ICivilizationData, type TCivilization } from '@/content'
import { Box, HStack, SimpleGrid } from '@chakra-ui/react'
import NextImage from 'next/image'
import { useState } from 'react'

interface ICivilizationSelectorProps {
  activeCivilization: TCivilization
  setCivilization: (civilization: ICivilizationData) => void
}

export function CivilizationSelector({ activeCivilization, setCivilization }: ICivilizationSelectorProps) {
  const [hoveredImage, setHoveredImage] = useState<string | undefined>(undefined)

  return (
    <HStack
      alignItems="center"
      flexDirection="row"
      height={{ base: '50px', md: '70px', lg: '100px', xl: '120px' }}
      justifyContent="center"
      marginBottom={{ base: '15px', md: '100px' }}
      marginTop={{ base: '90px', md: '100px' }}
      width="full"
      zIndex={20}
    >
      <SimpleGrid
        columns={{ base: !activeCivilization ? 3 : 6 }}
        maxHeight="25px"
        paddingX={{ base: 2, md: 10 }}
        spaceX={{ base: 5, md: 10 }}
      >
        {Object.values(CIVILIZATIONS).map((civilization: ICivilizationData, i) => (
          <Box
            key={civilization.civilization}
            className={`animate_delay animate__animated animate__fadeInDown animate__slowest animate__delay-${i}s`}
            cursor="pointer"
            height={{ base: '50px', md: '70px', lg: '100px', xl: '120px' }}
            width={{ base: '50px', md: '70px', lg: '100px', xl: '120px' }}
            onClick={() => setCivilization(civilization)}
          >
            <NextImage
              alt={civilization.id}
              height="141"
              src={civilization.badge}
              width="141"
              priority
              onMouseEnter={() => setHoveredImage(civilization.id)}
              onMouseLeave={() => setHoveredImage('')}
            />
          </Box>
        ))}
      </SimpleGrid>
    </HStack>
  )
}
