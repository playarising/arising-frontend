import './global.css'


import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const TOKENS = {
  colors: {
    'custom-blue': { value: '#57e1ec' },
    'custom-dark-contrast': { value: '#687173' },
    'custom-dark-primary': { value: '#022127' },
    'custom-keppel': { value: '#3398a5' },
    'custom-light-silver': { value: '#c8caca' }
  }
}

const CONFIG = defineConfig({
  globalCss: {
    body: {
      background: 'custom-dark-primary',
      fontFamily: 'var(--font-montserrat)'
    }
  },
  theme: {
    tokens: TOKENS
  }
})

export const SYSTEM = createSystem(CONFIG, defaultConfig)
