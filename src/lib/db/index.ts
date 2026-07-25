import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// max: 1 — each serverless function invocation uses at most one connection
const client = postgres(process.env.DATABASE_URL!, { max: 1 })

export const db = drizzle(client, { schema })
