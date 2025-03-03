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
    <Stack margin={0} maxHeight="calc(100vh)" minHeight="calc(100vh)" position="relative">
      {withBackground && (
        <Box height="calc(100vh)" margin="0 !important" minWidth="calc(100vw)" position="absolute" top={0}>
          <NextImage alt="World of Etia" src={image} style={{ objectFit: 'cover' }} fill />
          <ChakraContainer
            backgroundColor="black"
            height="calc(100vh)"
            minWidth="calc(100vw)"
            opacity={bgOpacity}
            position="absolute"
            top={0}
            zIndex={20}
          />
        </Box>
      )}
      <Center height="calc(100vh)" width="full">
        {children}
      </Center>
      {showFooter && <Footer />}
    </Stack>
  )
}
