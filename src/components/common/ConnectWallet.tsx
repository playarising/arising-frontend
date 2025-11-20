'use client'

import { Flex, Text } from '@chakra-ui/react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import Image from 'next/image'

export function ConnectWalletButton({ title = 'START' }: { title?: string }) {
  const { setVisible } = useWalletModal()

  const handleClick = () => {
    setVisible(true)
  }

  return (
    <Flex
      as="button"
      cursor="pointer"
      onClick={handleClick}
      paddingBottom={24}
      position="relative"
      role="button"
      tabIndex={0}
      width="250px"
    >
      <Flex
        flexDirection="row"
        fontSize={20}
        justifyContent="center"
        position="absolute"
        top="7px"
        width="full"
        zIndex={5}
      >
        <Text color="white" fontWeight="600">
          {title}
        </Text>
      </Flex>
      <Image
        alt="Enter the story of Etia"
        height="90"
        src="/assets/backgrounds/start-button.webp"
        width="498"
        priority
      />
    </Flex>
  )
}
