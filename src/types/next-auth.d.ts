import type { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?:
      | (DefaultSession['user'] & {
          id?: string
          address?: string
        })
      | null
  }

  interface User extends DefaultUser {
    id: string
    address?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    address?: string
  }
}
