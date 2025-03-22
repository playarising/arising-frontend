import { Box } from '@chakra-ui/react'
import Image from 'next/image'
import Link from 'next/link'

export function HeaderLogo() {
  return (
    <Box h="70px" w="70px">
      <Link href="/">
        <Image
          alt="Arising Logo Top"
          src="/assets/logo-top.png"
          width={484}
          height={422}
          priority
          style={{ objectFit: 'contain' }}
        />
      </Link>
    </Box>
  )
}
