'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

const IS_DEV = process.env.NODE_ENV === 'development'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const result = await signIn('resend', { email, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Failed to send magic link. Please try again or contact support.')
      console.error('[auth] signIn error:', result.error)
    } else {
      setSubmitted(true)
    }
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    await signIn('dev', { email, callbackUrl: '/' })
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/' })
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

      {/* Google OAuth button */}
      <>
        <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--card)',
              color: 'var(--fg)',
              fontSize: 15,
              fontWeight: 500,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.7 : 1,
              transition: 'background 120ms',
            }}
          >
            {!googleLoading && <GoogleIcon />}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
      </>

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

      {error && (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--red-600, #dc2626)', textAlign: 'center' }}>
          {error}
        </p>
      )}

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
