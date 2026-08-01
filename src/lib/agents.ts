import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// Shared guard: Vercel Cron calls include this header with the secret
export function verifyCron(req: Request): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}
