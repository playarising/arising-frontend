'use client'

import { Flex, Text } from '@chakra-ui/react'
import Image from 'next/image'

import { AppLink } from '../navigation'

export function StartButton() {
  return (
    <AppLink
      aria-label="Begin your journey in Arising"
      href="/play"
      style={{ display: 'inline-flex', textDecoration: 'none', width: '250px' }}
    >
      <Flex cursor="pointer" paddingBottom={24} position="relative" width="full">
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
          priority
          src="/assets/backgrounds/start-button.webp"
          width="498"
        />
      </Flex>
    </AppLink>
  )
}
