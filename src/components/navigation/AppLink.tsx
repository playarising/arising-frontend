'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

type AnchorProps = ComponentPropsWithoutRef<'a'>

export type AppLinkProps = NextLinkProps &
  Omit<AnchorProps, keyof NextLinkProps> & {
    isExternal?: boolean
  }

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ children, href, isExternal = false, rel, target, ...rest }, ref) => {
    const resolvedRel = isExternal ? 'noopener noreferrer' : rel
    const resolvedTarget = isExternal ? '_blank' : target

    return (
      <NextLink href={href} ref={ref} rel={resolvedRel} target={resolvedTarget} {...rest}>
        {children}
      </NextLink>
    )
  }
)

AppLink.displayName = 'AppLink'
