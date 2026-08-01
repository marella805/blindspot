import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/demo', '/api/auth', '/api/mcp', '/api/agents']

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isPublic) {
    await auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
}
