import { Button } from '@chakra-ui/react'
import { BarsIcon } from '../Icons'

export function MenuButton({ setOpen }: { setOpen: (open: boolean) => void }) {
  return (
    <Button
      _hover={{ bg: 'custom-blue', color: 'custom-dark-primary' }}
      background="black"
      color="custom-blue"
      size="sm"
      width="40px"
      onClick={() => setOpen(true)}
    >
      <BarsIcon height="5" width="5" />
    </Button>
  )
}
