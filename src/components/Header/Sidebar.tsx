import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, VStack } from '@chakra-ui/react'
import { CloseIcon } from '../Icons'
import { MENU_LINKS } from './Header'
import { HeaderLogo } from './Logo'
import { MenuLink } from './MenuLink'

export function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Drawer.Root open={open} placement="end" size="full">
      <DrawerContent bg="custom-dark-primary" pos="relative">
        <DrawerHeader p={4} display="flex" alignItems="center" justifyContent="space-between">
          <HeaderLogo />
          <Button
            aria-label="Close menu"
            _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
            bg="black"
            color="custom-blue"
            size="sm"
            w="40px"
            onClick={close}
          >
            <CloseIcon height={5} width={5} />
          </Button>
        </DrawerHeader>
        <DrawerBody>
          <VStack align="start" spaceY={4}>
            {MENU_LINKS.map((link) => (
              <MenuLink key={link.href} label={link.label} href={link.href} />
            ))}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer.Root>
  )
}
