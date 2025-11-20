'use client'

import { Center, Spinner } from '@chakra-ui/react'

type ModuleLoaderProps = {
  loading: boolean
  label?: string
}

export function ModuleLoader({ loading, label }: ModuleLoaderProps) {
  if (!loading) return null
  return (
    <Center position="absolute" inset={0} bg="rgba(0, 0, 0, 0.4)" zIndex={20} flexDirection="column" gap={3}>
      <Spinner color="custom-blue" size="lg" />
      {label ? <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{label}</span> : null}
    </Center>
  )
}
