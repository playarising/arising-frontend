'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { forwardRef, type ReactNode } from 'react'

export type AppLinkProps = NextLinkProps & {
  isExternal?: boolean
  rel?: string
  title?: string
  target?: string
  children: ReactNode
}

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ children, href, isExternal = false, rel, target, ...rest }, ref) => {
    return (
      <NextLink
        href={href}
        ref={ref}
        rel={isExternal ? 'noopener noreferrer' : rel}
        target={isExternal ? '_blank' : target}
        {...rest}
      >
        {children}
      </NextLink>
    )
  }
)

AppLink.displayName = 'AppLink'
