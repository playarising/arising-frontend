'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import type { ReactNode } from 'react'

export type TLinkProps = NextLinkProps & {
  external?: boolean
  children: ReactNode
  rel?: string
}

export function Link({ children, href, external = false, rel }: TLinkProps) {
  return (
    <NextLink href={href} rel={external ? 'noopener noreferrer' : rel} target={external ? '_blank' : '_self'} passHref>
      {children}
    </NextLink>
  )
}
