import { Button } from '@chakra-ui/react'
import { TwitterIcon } from '../Icons'
import { Link } from '../Link'

export function TwitterButton() {
  return (
    <Link href="https://twitter.com/playarising" external>
      <Button
        aria-label="Twitter"
        _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
        bg="black"
        color="custom-blue"
        h="36px"
        w="36px"
        p={0}
      >
        <TwitterIcon height={5} width={5} />
      </Button>
    </Link>
  )
}
