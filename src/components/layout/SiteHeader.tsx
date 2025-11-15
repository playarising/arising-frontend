'use client'


import { Box, Button, Drawer, Flex, HStack, Stack, Text, useBreakpointValue, VStack } from '@chakra-ui/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { BarsIcon } from '../icons'
import { AppLink } from '../navigation'

const HEADER_LINKS = [
  { href: '/', item: 'HOME', title: 'home' },
  { href: '/play', item: 'PLAY', title: 'play' }
]

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer.Root open={open} size="full" onExitComplete={onClose}>
      <Drawer.Backdrop />
      <Drawer.Content background="custom-dark-primary" position="relative">
        <Drawer.Header>
          <HStack align="center" direction="row" justify="space-between" marginX="2">
            <Flex alignItems="center" width="40px">
              <AppLink href="/">
                <Image alt="Arising Logo Top" height="768" src="/assets/logo.webp" width="484" />
              </AppLink>
            </Flex>
            <Drawer.CloseTrigger
              _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
              background="black"
              color="custom-blue"
              height="30px"
              width="30px"
            />
          </HStack>
        </Drawer.Header>

        <Drawer.Body>
          <VStack align="start">
            <MenuLinks isDesktop={false} onClose={onClose} />
          </VStack>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  )
}

function MenuLinks({ isDesktop, onClose }: { isDesktop: boolean; onClose?: () => void }) {
  const router = useRouter()

  const handleClick = (route: string, onClose?: () => void) => {
    router.push(route)
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {HEADER_LINKS.map((link) => (
        <Box key={link.title} padding={1} width={!isDesktop ? '200px' : ''}>
          <AppLink href={link.href}>
            <Button
              aria-label={`Navigate to ${link.item.toLowerCase()}`}
              _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
              background="black"
              color="custom-blue"
              size="sm"
              onClick={() => handleClick(link.href, onClose)}
            >
              <Text
                fontSize="sm"
                fontWeight="bold"
                letterSpacing="1px"
                margin={0}
                padding={0}
                rounded="md"
                textAlign={!isDesktop ? 'center' : 'left'}
                width="full"
              >
                {link.item}
              </Text>
            </Button>
          </AppLink>
        </Box>
      ))}
    </>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  const mobile = useBreakpointValue({ base: true, lg: false })

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Stack as="header" margin="0 !important" position="absolute" top={0} width="full" zIndex="100">
      <SideMenu open={open} onClose={handleClose} />
      <HStack direction="row" justify="space-between" marginX="10" marginY="2">
        <Flex alignItems="center" height="80px" width="40px">
          <AppLink href="/">
            <Image alt="Arising Logo Top" height="768" src="/assets/logo-top.png" width="484" priority />
          </AppLink>
        </Flex>
        <HStack justify="right">
          {!mobile && <MenuLinks isDesktop />}

          {mobile && (
            <Button
              aria-label="Toggle navigation menu"
              _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
              background="black"
              color="custom-blue"
              size="sm"
              width="40px"
              onClick={() => setOpen(true)}
            >
              <BarsIcon height="10" width="10" />
            </Button>
          )}
        </HStack>
      </HStack>
    </Stack>
  )
}
