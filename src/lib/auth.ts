import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { accounts, users, verificationTokens } from './db/schema'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    // Dev-only instant login — skipped in production
    Credentials({
      id: 'dev',
      name: 'Dev Login',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(credentials) {
        if (process.env.NODE_ENV !== 'development') return null
        const email = credentials?.email as string | undefined
        if (!email?.includes('@')) return null

        let user = await db.query.users.findFirst({ where: eq(users.email, email) })
        if (!user) {
          ;[user] = await db.insert(users).values({ email }).returning()
        }
        return { id: user.id, email: user.email, name: user.name ?? email }
      },
    }),
    // Magic-link email — only active when key is configured
    ...(process.env.AUTH_RESEND_KEY
      ? [Resend({ from: 'Blindspot <noreply@blindspot.app>' })]
      : []),
  ],
})
