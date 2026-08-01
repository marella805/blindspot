import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'

export async function getUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  let user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })

  if (!user) {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ''
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null
    ;[user] = await db.insert(users).values({ clerkId, email, name }).returning()
  }

  return user
}
