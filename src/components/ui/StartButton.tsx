'use client'

import { Flex, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { AppLink } from '../navigation'

export function StartButton() {
  return (
    <AppLink href="/play">
      <Flex cursor="pointer" paddingBottom={24} position="relative" role="button" tabIndex={-1} width="250px">
        <Flex
          flexDirection="row"
          fontSize={20}
          justifyContent="center"
          position="absolute"
          top="7px"
          width="full"
          zIndex={5}
        >
          <Text color="white" fontWeight="600">
            START
          </Text>
        </Flex>
        <Image
          alt="Enter the story of Etia"
          height="90"
          src="/assets/backgrounds/start-button.webp"
          width="498"
          priority
        />
      </Flex>
    </AppLink>
  )
}
