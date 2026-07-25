import type { NextAuthConfig } from 'next-auth'

// Edge-compatible subset of auth config — no Node.js imports.
// Used by middleware for JWT validation. Full config (with adapter) is in auth.ts.
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
  pages: { signIn: '/login' },
}
