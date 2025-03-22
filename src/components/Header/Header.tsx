'use client'

import Image from 'next/image'

import { Link } from '@/components'
import { Box, Button, Drawer, HStack, Stack, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import { useState } from 'react'
import { BarsIcon, CloseIcon, TwitterIcon } from '../Icons'

const MENU_LINKS = [
  { href: '/', item: 'HOME', title: 'home' },
  {
    href: '/civilizations',
    item: 'CIVILIZATIONS',
    title: 'civilizations'
  },
  {
    href: '/explore',
    item: 'EXPLORE',
    title: 'explore'
  },
  { href: '/play', item: 'PLAY', title: 'play' }
]

function TwitterButton() {
  return (
    <Link href="https://twitter.com/playarising" isExternal>
      <Button
        _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
        background="black"
        color="custom-blue"
        height="36px"
        width="36px"
        paddingX="0"
      >
        <TwitterIcon height={5} width={5} />
      </Button>
    </Link>
  )
}

function MenuButton({ setOpen }: { setOpen: (open: boolean) => void }) {
  return (
    <Button
      _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
      background="black"
      color="custom-blue"
      size="sm"
      width="40px"
      onClick={() => setOpen(true)}
    >
      <BarsIcon height="5" width="5" />
    </Button>
  )
}

function MenuLink({ href, text }: { href: string; text: string }) {
  const mobile = useBreakpointValue({ base: true, lg: false })

  return (
    <Link href={href}>
      <Button
        _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
        background="black"
        color="custom-blue"
        height="36px"
      >
        <Text
          fontSize="sm"
          fontWeight="bold"
          letterSpacing="1px"
          margin={0}
          padding={0}
          rounded="md"
          textAlign={mobile ? 'left' : 'center'}
          width="full"
        >
          {text.toUpperCase()}
        </Text>
      </Button>
    </Link>
  )
}

function SideMenu({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Drawer.Root open={open} size="full">
      <Drawer.Backdrop />
      <Drawer.Content background="custom-dark-primary" position="relative">
        <Drawer.Header>
          <HStack align="center" direction="row" justify="space-between" marginX="2" height="70px">
            <Box height="70px" width="70px">
              <Link href="/">
                <Image alt="Arising Logo Top" height="422" src="/assets/logo-top.png" width="484" priority />
              </Link>
            </Box>

            <Button
              _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
              background="black"
              color="custom-blue"
              size="sm"
              width="40px"
              onClick={() => close()}
            >
              <CloseIcon height="5" width="5" />
            </Button>
          </HStack>
        </Drawer.Header>

        <Drawer.Body>
          <VStack align="start">
            {MENU_LINKS.map((link) => (
              <MenuLink key={link.title} text={link.title} href={link.href} />
            ))}
          </VStack>
        </Drawer.Body>

        <Drawer.Footer paddingY={10}>
          <VStack align="left" width="full">
            <HStack justifyContent="left" gap="2" width="full" />
          </VStack>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Root>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)

  const mobile = useBreakpointValue({ base: true, lg: false })

  return (
    <Stack margin="0 !important" position="absolute" top={0} width="full" zIndex="100">
      <SideMenu open={open} close={() => setOpen(false)} />
      <HStack direction="row" justify="space-between" marginX="10" marginY="2" height="80px" alignItems="center">
        <Box height="70px" width="70px">
          <Link href="/">
            <Image alt="Arising Logo Top" height="422" src="/assets/logo-top.png" width="484" priority />
          </Link>
        </Box>
        <HStack justifyContent="end" width="full" alignItems="center">
          {mobile ? (
            <MenuButton setOpen={setOpen} />
          ) : (
            MENU_LINKS.map((link) => <MenuLink key={link.title} text={link.title} href={link.href} />)
          )}
          <TwitterButton />
        </HStack>
      </HStack>
    </Stack>
  )
}
