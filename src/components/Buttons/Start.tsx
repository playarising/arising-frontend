'use client'

import { Flex, Text } from '@chakra-ui/react'

import { Link } from '../Link'

export function StartButton() {
  return (
    <Link href="/play">
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
          <Text color="white" fontWeight="700" letterSpacing={2}>
            Start
          </Text>
        </Flex>
        {/*  <NextImage alt="Enter the story of Etia" height="90" src={buttonBackground} width="498" /> */}
      </Flex>
    </Link>
  )
}
