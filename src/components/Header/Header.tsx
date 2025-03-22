'use client'

import { HStack, Stack, useBreakpointValue } from '@chakra-ui/react'
import { useState } from 'react'
import { HeaderLogo } from './Logo'
import { MenuButton } from './MenuButton'
import { MenuLink } from './MenuLink'
import { Sidebar } from './Sidebar'
import { TwitterButton } from './SocialButtons'

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
    <Stack position="absolute" top={0} w="full" zIndex={100} m={0}>
      <Sidebar open={open} close={() => setOpen(false)} />
      <HStack justify="space-between" mx={10} my={2} h="80px" align="center">
        <HeaderLogo />
        <HStack justify="end" w="full" align="center" spaceX={4}>
          {mobile ? (
            <MenuButton setOpen={setOpen} />
          ) : (
            MENU_LINKS.map((link) => <MenuLink key={link.href} label={link.label} href={link.href} />)
          )}
          <TwitterButton />
        </HStack>
      </HStack>
    </Stack>
  )
}
