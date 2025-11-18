import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { PageContainer, StartButton } from '@/components'
import { authOptions } from '@/lib'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.address) {
    redirect('/play')
  }

  return (
    <PageContainer>
      <VStack
        alignItems="center"
        as="section"
        gap={6}
        height="full"
        justifyContent="center"
        marginX="auto"
        textAlign="center"
        width="full"
        zIndex={20}
      >
        <Box
          as="header"
          className="animate_delay animate__animated animate__fadeIn animate__slower"
          maxWidth={{ base: 320, md: 640 }}
          width="full"
        >
          <Image
            alt="Arising: A Twirl of Destinies"
            className="object-contain"
            height={288}
            priority
            sizes="(max-width: 768px) 320px, 640px"
            src="/assets/logo.webp"
            width={870}
          />
        </Box>

        <Heading
          as="h1"
          className="animate__animated animate_delay animate__delay-3s animate__fadeIn animate__slow"
          color="custom-blue"
          fontSize={{ base: '3xl', md: '5xl' }}
        >
          A Twirl of Destinies
        </Heading>

        <Text
          as="p"
          className="animate_delay animate__animated animate__delay-4s animate__fadeIn animate__slow"
          color="white"
          fontSize={{ base: 'md', md: 'lg' }}
          maxWidth="350px"
        >
          Every choice becomes history. Etia is the on-chain RPG that never forgets.
        </Text>

        <Box className="animate_delay animate__animated animate__delay-5s animate__fadeIn animate__slow" paddingY={5}>
          <StartButton />
        </Box>
      </VStack>
    </PageContainer>
  )
}
