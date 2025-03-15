'use client'

import { Box, Button, Flex, HStack, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { BarsIcon, HomeIcon, TwitterIcon } from '../Icons'
import { Link } from '../Link'

function MenuLinks({ mobile, onClose }: { mobile: boolean; onClose?: () => void }) {
  const router = useRouter()

  const headerLinks = [
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

  const handleClick = (menuLink, onClose?) => {
    router.push(menuLink.href)
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {headerLinks.map((menuLink) => {
        return (
          <Box key={menuLink.title} padding={1} width={!mobile ? '200px' : ''}>
            <Link href={menuLink.href}>
              <Button
                _active={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
                _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
                background="black"
                color="custom-blue"
                size="sm"
                onClick={() => handleClick(menuLink, onClose)}
              >
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  letterSpacing="1px"
                  margin={0}
                  padding={0}
                  rounded="md"
                  textAlign={!mobile ? 'center' : 'left'}
                  width="full"
                >
                  {menuLink.item}
                </Text>
              </Button>
            </Link>
          </Box>
        )
      })}
    </>
  )
}

export function Header() {
  const mobile = useBreakpointValue({ base: true, lg: false })

  return (
    <Stack margin="0 !important" position="absolute" top={0} width="full" zIndex="100">
      <HStack direction="row" justify="space-between" marginX="10" marginY="2">
        <Flex alignItems="center" height="80px" width="40px">
          <Link href="/">{/* <Image alt="Arising Logo Top" height="768" src={logoTop} width="484" priority /> */}</Link>
        </Flex>
        <HStack justify="right">
          {mobile ? (
            <Button
              _hover={{ bg: 'blue', color: 'dark.primary' }}
              background="black"
              color="blue"
              size="sm"
              width="40px"
            >
              <BarsIcon height="10" width="10" />
            </Button>
          ) : (
            <HStack>
              <Link href="/" isExternal={false}>
                <Button
                  _active={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
                  _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
                  background="black"
                  color="custom-blue"
                  height="32px"
                  paddingX="0"
                >
                  <HomeIcon height={5} width={5} />
                </Button>
              </Link>
              <MenuLinks mobile />
              <Link href="https://twitter.com/playarising" isExternal>
                <Button
                  _active={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
                  _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
                  background="black"
                  color="custom-blue"
                  height="32px"
                  paddingX="0"
                >
                  <TwitterIcon height={5} width={5} />
                </Button>
              </Link>
            </HStack>
          )}
        </HStack>
      </HStack>
    </Stack>
  )
}
