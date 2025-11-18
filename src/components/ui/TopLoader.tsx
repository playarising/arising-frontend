'use client'

import dynamic from 'next/dynamic'

const NextTopLoader = dynamic(() => import('nextjs-toploader'), {
  ssr: false
})

export function TopLoader() {
  return <NextTopLoader color="#00f0ff" height={3} showSpinner={false} />
}
