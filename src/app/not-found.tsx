import { AppLink, PageContainer } from '@/components'
import { Box, Heading, Text, VStack } from '@chakra-ui/react'

export default function NotFound() {
  return (
    <PageContainer>
      <VStack gap={6} textAlign="center" zIndex={20}>
        <Heading as="h1" color="custom-blue" fontSize={{ base: '2xl', md: '4xl' }}>
          Page not found
        </Heading>
        <Text color="white" fontSize={{ base: 'md', md: 'lg' }}>
          The page you are looking for has been lost in the shifting sands of Etia.
        </Text>
        <Box>
          <AppLink href="/">
            <Text
              _hover={{ color: 'custom-blue' }}
              color="white"
              fontSize="lg"
              fontWeight="bold"
              letterSpacing="0.08em"
            >
              RETURN HOME
            </Text>
          </AppLink>
        </Box>
      </VStack>
    </PageContainer>
  )
}
