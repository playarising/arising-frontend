'use client'

import { Box, Center, Container as ChakraContainer, Flex, Heading, Stack, Text, VStack } from '@chakra-ui/react'
import NextImage from 'next/image'

export default function NotFound() {
  return (
    <Stack margin={0} maxHeight="calc(100vh)" minHeight="calc(100vh)" position="relative">
      <Box height="calc(100vh)" margin="0 !important" minWidth="calc(100vw)" position="absolute" top={0}>
        <NextImage alt="World of Etia" src="/assets/backgrounds/map.jpg" style={{ objectFit: 'cover' }} fill />
        <ChakraContainer
          backgroundColor="black"
          height="calc(100vh)"
          minWidth="calc(100vw)"
          opacity="70%"
          position="absolute"
          top={0}
          zIndex={20}
        />
      </Box>
      <Center height="calc(100vh)" width="full">
        <VStack align="center" height="full" justifyContent="center" marginX="auto" width="full" zIndex={20}>
          <Box>
            <Heading color="custom-blue" fontSize={{ base: '2xl', md: '5xl' }}>
              Page not found
            </Heading>
          </Box>

          <Box paddingY="5">
            <a href="/">
              <Flex cursor="pointer" paddingBottom={24} position="relative" width="250px">
                <Flex
                  flexDirection="row"
                  fontSize={20}
                  justifyContent="center"
                  position="absolute"
                  top="7px"
                  width="full"
                  zIndex={5}
                >
                  <Text color="white" fontSize="xl" fontWeight="600">
                    RETURN HOME
                  </Text>
                </Flex>
                <NextImage
                  alt="Enter the story of Etia"
                  height="90"
                  src="/assets/backgrounds/start-button.png"
                  width="498"
                />
              </Flex>
            </a>
          </Box>
        </VStack>
      </Center>
    </Stack>
  )
}
