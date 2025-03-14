'use client'

import { Box, Center, Container as ChakraContainer, Stack, type StackProps } from '@chakra-ui/react'
import NextImage from 'next/image'
import { Footer } from '../Footer'

export interface IContainerProps extends StackProps {
  children: React.ReactNode
  showFooter?: boolean
  withBackground?: boolean
  bgOpacity?: string
  image?: string
  height?: string
  backgroundFill?: boolean
}

export function Container({
  children,
  showFooter = true,
  withBackground = true,
  bgOpacity = '70%',
  image = '/assets/backgrounds/map.jpg'
}: IContainerProps) {
  return (
    <Stack margin={0} maxHeight="100dvh" minHeight="100dvh" position="relative">
      {withBackground && (
        <Box height="100dvh" margin="0 !important" minWidth="100dvw" position="absolute" top={0}>
          <NextImage alt="World of Etia" src={image} style={{ objectFit: 'cover' }} fill />
          <ChakraContainer
            backgroundColor="black"
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
      {showFooter && <Footer />}
    </Stack>
  )
}
