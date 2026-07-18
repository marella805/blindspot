'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    await signIn('resend', { email, redirect: false })
    setSubmitted(true)
    setLoading(false)
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    await signIn('dev', { email, callbackUrl: '/' })
  }

  if (submitted) {
    return (
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{
          padding: '20px 24px',
          background: 'var(--blue-ink-50)',
          border: '1px solid var(--blue-ink-100)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}>
          <i className="ph-fill ph-paper-plane-tilt" style={{ fontSize: 28, color: 'var(--blue-ink-600)', marginBottom: 12, display: 'block' }} />
          <p style={{ fontSize: 15, color: 'var(--blue-ink-800)', lineHeight: '24px' }}>
            Check your inbox — we sent a link to <strong>{email}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 16 }}>
          Blindspot
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: 8 }}>
          Sign in
        </h1>
        <p className="muted">
          {IS_DEV ? 'Enter any email to sign in instantly.' : "We'll send a magic link to your email."}
        </p>
      </div>

      <form
        onSubmit={IS_DEV ? handleDevLogin : handleMagicLink}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoFocus
          style={{
            height: 48,
            padding: '0 16px',
            border: '1px solid var(--input)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            fontSize: 15,
            color: 'var(--fg)',
            outline: 'none',
            width: '100%',
          }}
        />
        <button
          type="submit"
          className="btn-lime"
          disabled={loading || !email.trim()}
          style={{ height: 48, fontSize: 15, justifyContent: 'center' }}
        >
          {loading ? 'Signing in…' : IS_DEV ? 'Sign in' : 'Send magic link'}
          {!loading && <i className="ph-bold ph-arrow-right" style={{ fontSize: 15 }} />}
        </button>
      </form>

      {IS_DEV && (
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--fg-muted)', padding: '8px 12px', background: 'var(--muted)', borderRadius: 8 }}>
          Dev mode — no email sent, instant access
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--fg-muted)' }}>
        Want to explore first?{' '}
        <a href="/demo" style={{ color: 'var(--blue-ink-600)', textDecoration: 'none' }}>
          Try the demo →
        </a>
      </p>
    </div>
  )
}
