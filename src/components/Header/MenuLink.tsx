import { Button, Text, useBreakpointValue } from '@chakra-ui/react'
import Link from 'next/link'

export function MenuLink({ href, label }: { href: string; label: string }) {
  const mobile = useBreakpointValue({ base: true, lg: false })

  return (
    <Link href={href}>
      <Button _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }} bg="black" color="custom-blue" h="36px">
        <Text
          fontSize="sm"
          fontWeight="bold"
          letterSpacing="1px"
          m={0}
          p={0}
          rounded="md"
          textAlign={mobile ? 'left' : 'center'}
          w="full"
        >
          {label}
        </Text>
      </Button>
    </Link>
  )
}
