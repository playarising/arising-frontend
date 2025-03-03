'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import type { ReactNode } from 'react'

export type TLinkProps = NextLinkProps & {
  isExternal?: boolean
  children: ReactNode
  rel?: string
}

export function Link({ children, href, isExternal = false, rel }: TLinkProps) {
  return (
    <NextLink
      href={href}
      rel={isExternal ? 'noopener noreferrer' : rel}
      target={isExternal ? '_blank' : '_self'}
      passHref
    >
      {children}
    </NextLink>
  )
}
