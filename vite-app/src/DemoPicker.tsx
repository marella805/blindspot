import type { DemoMode } from './types'

interface Props {
  onSelect: (mode: Exclude<DemoMode, 'picker'>) => void
}

export function DemoPicker({ onSelect }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDE9E3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Wordmark */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6B6470' }}>
          Blindspot
        </span>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 400,
        letterSpacing: '-0.025em',
        color: '#1B1820',
        textAlign: 'center',
        lineHeight: 1.1,
        marginBottom: 12,
      }}>
        Stress-test your reasoning<br />before you commit.
      </h1>

      <p style={{ fontSize: 18, lineHeight: '28px', color: '#6B6470', textAlign: 'center', maxWidth: 460, marginBottom: 56 }}>
        Choose a demo view to explore the product.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 720,
      }}>
        {/* Fresh / First Decision */}
        <button
          onClick={() => onSelect('fresh')}
          style={{
            background: '#F8F5EF',
            border: '1px solid #D8D0C6',
            borderRadius: 16,
            padding: '32px 28px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 150ms, box-shadow 150ms, transform 150ms',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#4E3D63'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(78,61,99,0.12)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#D8D0C6'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(150deg, #EDE7F0, #DCD1E2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ph ph-scales" style={{ fontSize: 22, color: '#4E3D63' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#6B6470', marginBottom: 2 }}>First Decision</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1B1820' }}>Cold start</div>
            </div>
          </div>

          <p style={{ fontSize: 15, lineHeight: '24px', color: '#6B6470', marginBottom: 24 }}>
            You're a new user with no history. Walk through a first interrogation from scratch — choosing between Berkeley and NYU.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {['Empty decision log', 'First interrogation with sample responses', 'See the cold-start experience'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B6470' }}>
                <i className="ph ph-check" style={{ fontSize: 14, color: '#4E3D63', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4E3D63', fontSize: 15, fontWeight: 500, marginTop: 'auto' }}>
            Start interrogation
            <i className="ph-bold ph-arrow-right" style={{ fontSize: 14 }} />
          </div>
        </button>

        {/* Seasoned User */}
        <button
          onClick={() => onSelect('seasoned')}
          style={{
            background: 'linear-gradient(165deg, #2C2239 0%, #17111F 55%, #120C19 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '32px 28px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 150ms, box-shadow 150ms, transform 150ms',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#B8D14A'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(184,209,74,0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(184,209,74,0.15)',
              border: '1px solid rgba(184,209,74,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ph-fill ph-chart-line-up" style={{ fontSize: 22, color: '#B8D14A' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8E80A0', marginBottom: 2 }}>Seasoned User</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#F5F1E8' }}>One year in</div>
            </div>
          </div>

          <p style={{ fontSize: 15, lineHeight: '24px', color: '#B4A8C2', marginBottom: 24 }}>
            Jordan has logged 6 decisions across her first year at Berkeley. The pattern engine is active. Reflections are due.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {[
              '6 decisions — education, career, personal',
              '3 cross-decision patterns detected',
              '2 reflections due, 2 completed',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8E80A0' }}>
                <i className="ph ph-check" style={{ fontSize: 14, color: '#B8D14A', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B8D14A', fontSize: 15, fontWeight: 500, marginTop: 'auto' }}>
            View log
            <i className="ph-bold ph-arrow-right" style={{ fontSize: 14 }} />
          </div>
        </button>
      </div>

      {/* Reset link */}
      <p style={{ marginTop: 40, fontSize: 13, color: '#B8B0C4' }}>
        You can switch views at any time using the reset button in the sidebar.
      </p>
    </div>
  )
}
