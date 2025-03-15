'use client'

import Image from 'next/image'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'

import { Link } from '@/components'
import { Box, Button, Drawer, Flex, HStack, Stack, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import { useState } from 'react'
import { BarsIcon, TwitterIcon } from '../Icons'

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer.Root open={open} size="full" onExitComplete={onClose}>
      <Drawer.Backdrop />
      <Drawer.Content background="custom-dark-primary" position="relative">
        <Box opacity="30%" position="absolute" right="-80px" top="0">
          <NextImage
            alt="Ard Noble"
            height="768"
            src="/assets/backgrounds/ard-noble.png"
            style={{ objectFit: 'contain' }}
            width="421"
            priority
          />
        </Box>
        <Drawer.Header>
          <HStack align="center" direction="row" justify="space-between" marginX="2">
            <Flex alignItems="center" width="40px">
              <Link href="/">
                <Image alt="Arising Logo Top" height="768" src="/assets/logo-top.png" width="484" />
              </Link>
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

        <Drawer.Footer paddingY={10}>
          <VStack align="left" width="full">
            <HStack justifyContent="left" gap="2" width="full">
              <MenuButtons />
            </HStack>
          </VStack>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Root>
  )
}

function MenuButtons() {
  return (
    <>
      <Link href="https://twitter.com/playarising" isExternal>
        <Button
          _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
          background="black"
          color="custom-blue"
          height="32px"
          paddingX="0"
        >
          <TwitterIcon height={5} width={5} />
        </Button>
      </Link>
    </>
  )
}

function MenuLinks({ isDesktop, onClose }: { isDesktop: boolean; onClose?: () => void }) {
  const router = useRouter()

  const headerLinks = [
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

  const handleClick = (route: string, onClose?: () => void) => {
    router.push(route)
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {headerLinks.map((link) => (
        <Box key={link.title} padding={1} width={!isDesktop ? '200px' : ''}>
          <Link href={link.href}>
            <Button
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
          </Link>
        </Box>
      ))}
    </>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)

  const mobile = useBreakpointValue({ base: true, lg: false })

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Stack margin="0 !important" position="absolute" top={0} width="full" zIndex="100">
      <SideMenu open={open} onClose={handleClose} />
      <HStack direction="row" justify="space-between" marginX="10" marginY="2">
        <Flex alignItems="center" height="80px" width="40px">
          <Link href="/">
            <Image alt="Arising Logo Top" height="768" src="/assets/logo-top.png" width="484" priority />
          </Link>
        </Flex>
        <HStack justify="right">
          {!mobile && (
            <>
              <MenuLinks isDesktop />
              <MenuButtons />
            </>
          )}

          {mobile && (
            <Button
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
