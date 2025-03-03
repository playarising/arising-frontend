'use client'

import { Flex, Text } from '@chakra-ui/react'
import NextImage from 'next/image'

export function StartButton() {
  return (
    <Flex cursor="disabled" paddingBottom={24} position="relative" width="250px" opacity="0.5">
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
      <NextImage alt="Enter the story of Etia" height="90" src="/assets/backgrounds/start-button.png" width="498" />
    </Flex>
  )
}
