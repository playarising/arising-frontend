'use client'

import { HStack, Text } from '@chakra-ui/react'

import { Link } from '../Link'

export function Footer() {
  return (
    <HStack
      align="center"
      bottom="0"
      direction="row"
      height="40px"
      justify="center"
      marginTop="0 !important"
      position="absolute"
      width="full"
      zIndex="100"
    >
      <Link href="https://kindynos.mx" external>
        <Text textAlign="center" color="custom-blue" fontSize="sm">
          © {new Date().getFullYear()}, Grupo Kindynos.
        </Text>
      </Link>
    </HStack>
  )
}
