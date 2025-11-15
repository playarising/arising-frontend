'use client'

import { HStack, Text } from '@chakra-ui/react'

import { AppLink } from '../navigation'

export function SiteFooter() {
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
      <AppLink href="https://kindynos.mx" isExternal>
        <Text textAlign="center" color="custom-blue" fontSize="sm">
          © {new Date().getFullYear()}, Grupo Kindynos.
        </Text>
      </AppLink>
    </HStack>
  )
}
