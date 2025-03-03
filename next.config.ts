import type { NextConfig } from 'next'

const NEXT_CONFIG: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react']
  }
}

export default NEXT_CONFIG