'use client'

import { Container, StartButton } from '@/components'
import { Box, Heading, VStack } from '@chakra-ui/react'
import Image from 'next/image'

export default function Page() {
  return (
    <Container>
      <VStack alignItems="center" h="full" justifyContent="center" mx="auto" w="full" zIndex={20}>
        <Box
          className="animate_delay animate__animated animate__fadeIn animate__slower"
          maxWidth={{ base: 400, md: 800 }}
        >
          <Image
            alt="Arsing: A Twirld of Destinies"
            className="object-fill"
            height="288"
            src="/assets/logo.png"
            width="870"
            priority
          />
        </Box>
        <Box
          className="animate__animated animate_delay animate__delay-3s animate__fadeIn animate__slow"
          color="custom-blue"
        >
          <Heading size={{ base: '2xl', md: '5xl' }}>A Twirl of Destinies</Heading>
        </Box>
        <Box
          className="animate_delay animate__animated animate__delay-4s animate__fadeIn animate__slow"
          color="white"
          fontSize={{ base: 'md', md: 'xl' }}
          maxWidth={{ base: '300px', md: '700px' }}
          paddingY="2"
          textAlign="center"
        >
          Summon, craft, fight, and forge your adventure!
        </Box>
        <Box className="animate_delay animate__animated animate__delay-5s animate__fadeIn animate__slow" paddingY="5">
          <StartButton />
        </Box>
      </VStack>
    </Container>
  )
}
