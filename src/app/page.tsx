import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const FEATURES = [
  {
    icon: 'ph-chat-teardrop-dots',
    title: 'Socratic Interrogation',
    body: 'One focused question per turn. Blindspot challenges the claim that matters most and doesn\'t stop until your reasoning survives.',
  },
  {
    icon: 'ph-chart-line-up',
    title: 'Pattern Engine',
    body: 'Every decision you log is cross-referenced against 67 documented cognitive blockers. Over time, your patterns surface.',
  },
  {
    icon: 'ph-arrow-u-up-left',
    title: 'Structured Reflection',
    body: 'Automatic 1-month and 3-month check-ins on every decision. Find out if what you predicted actually happened.',
  },
]

export default async function RootPage() {
  const user = await getUser()
  if (user) redirect('/log')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg, #1e1c18 0%, #141210 55%, #0e0c0a 100%)',
      color: '#e8e4de',
      fontFamily: '"Instrument Sans", "Inter", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '22px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontSize: '9.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#a09890',
        }}>
          Blindspot
        </span>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 14, color: '#c8c4be', textDecoration: 'none',
          padding: '8px 16px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          transition: 'background 150ms',
        }}>
          Log in
          <i className="ph ph-arrow-right" style={{ fontSize: 13 }} />
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 80px',
        maxWidth: 760, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#F5D98A', marginBottom: 32,
          padding: '6px 14px', borderRadius: 99,
          border: '1px solid rgba(245,217,138,0.25)',
          background: 'rgba(245,217,138,0.06)',
        }}>
          <i className="ph-fill ph-brain" style={{ fontSize: 13 }} />
          Decision Intelligence
        </div>

        <h1 style={{
          fontFamily: '"Rhymes Display", "Times New Roman", Times, ui-serif, serif',
          fontSize: 'clamp(48px, 8vw, 76px)',
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#f0ece6',
          marginBottom: 28,
        }}>
          The question you&apos;ve<br />been avoiding.
        </h1>

        <p style={{
          fontSize: 18, lineHeight: '30px', color: '#a09890',
          maxWidth: 540, marginBottom: 44,
        }}>
          Blindspot runs a Socratic interrogation on your thinking —
          one sharp question per turn, calibrated to your profile and
          past decisions — until your reasoning holds.
        </p>

        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          height: 52, padding: '0 28px',
          background: '#F5D98A', color: '#28241e',
          borderRadius: 10, fontWeight: 600, fontSize: 16,
          textDecoration: 'none', letterSpacing: '-0.01em',
          boxShadow: '0 2px 20px rgba(245,217,138,0.25)',
          transition: 'background 150ms, box-shadow 150ms',
        }}>
          Start Interrogating
          <i className="ph-bold ph-arrow-right" style={{ fontSize: 16 }} />
        </Link>

        <p style={{ marginTop: 18, fontSize: 13, color: '#5c5652' }}>
          No credit card · Private beta
        </p>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0 40px' }} />

      {/* Features */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 1, background: 'rgba(255,255,255,0.06)',
        margin: '0 40px',
        borderRadius: 0,
        overflow: 'hidden',
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            padding: '36px 32px',
            background: 'linear-gradient(165deg, #1a1814 0%, #111009 100%)',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(245,217,138,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <i className={`ph ${f.icon}`} style={{ fontSize: 20, color: '#F5D98A' }} />
            </div>
            <div style={{
              fontSize: 15, fontWeight: 600, color: '#e8e4de',
              marginBottom: 10, letterSpacing: '-0.01em',
            }}>
              {f.title}
            </div>
            <p style={{ fontSize: 14, lineHeight: '22px', color: '#7a756e' }}>
              {f.body}
            </p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 1,
      }}>
        <span style={{ fontSize: 12, color: '#5c5652', letterSpacing: '0.02em' }}>
          Private beta
        </span>
        <Link href="/demo" style={{ fontSize: 12, color: '#5c5652', textDecoration: 'none', letterSpacing: '0.02em' }}>
          View demo →
        </Link>
      </footer>

    </div>
  )
}
