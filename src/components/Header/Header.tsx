'use client'

import { Box, HStack, Stack, useBreakpointValue } from '@chakra-ui/react'
import { useState } from 'react'
import { HeaderLogo } from './Logo'
import { MenuButton } from './MenuButton'
import { MenuLink } from './MenuLink'
import { Sidebar } from './Sidebar'

export const MENU_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/civilizations', label: 'CIVILIZATIONS' },
  { href: '/explore', label: 'EXPLORE' },
  { href: '/play', label: 'PLAY' }
]

export function Header() {
  const [open, setOpen] = useState(false)

  const mobile = useBreakpointValue({ base: true, lg: false })

  return (
    <Stack width="full" m={0}>
      <Box position="absolute" width="full">
        <Sidebar open={open} close={() => setOpen(false)} />
      </Box>
      <HStack
        justify="space-between"
        px={10}
        my={2}
        h="80px"
        align="center"
        position="absolute"
        top="0"
        zIndex={100}
        width="100dvw"
      >
        <HeaderLogo />
        <HStack justify="end" w="full" align="center" spaceX={4}>
          {mobile ? (
            <MenuButton setOpen={setOpen} />
          ) : (
            MENU_LINKS.map((link) => <MenuLink key={link.href} label={link.label} href={link.href} />)
          )}
        </HStack>
      </HStack>
    </Stack>
  )
}
