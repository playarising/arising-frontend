'use client'

import { Box, Center, Container as ChakraContainer, Stack, type StackProps } from '@chakra-ui/react'
import Image from 'next/image'

export interface PageContainerProps extends StackProps {
  children: React.ReactNode
  withBackground?: boolean
  bgOpacity?: string | number
  image?: string
  overlayColor?: string
  fallbackBackground?: string
}

export function PageContainer({
  children,
  withBackground = true,
  bgOpacity = '70%',
  image = '/assets/backgrounds/map.webp',
  overlayColor = 'black',
  fallbackBackground = 'custom-dark-primary',
  ...rest
}: PageContainerProps) {
  return (
    <Stack
      margin={0}
      maxHeight="100dvh"
      minHeight="100dvh"
      position="relative"
      backgroundColor={!withBackground ? fallbackBackground : undefined}
      {...rest}
    >
      {withBackground && (
        <Box height="100dvh" margin="0 !important" minWidth="100dvw" position="absolute" top={0}>
          <Image alt="World of Etia" src={image} style={{ objectFit: 'cover' }} fill sizes="100vw" />
          <ChakraContainer
            backgroundColor={overlayColor}
            height="100dvh"
            minWidth="100dvw"
            opacity={bgOpacity}
            position="absolute"
            top={0}
            zIndex={20}
          />
        </Box>
      )}
      <Center height="100dvh" width="full">
        {children}
      </Center>
    </Stack>
  )
}
