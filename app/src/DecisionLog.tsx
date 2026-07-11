import type { AppData } from './types'

interface Props {
  data: AppData
  onStartInterrogation: () => void
}

export function DecisionLog({ data, onStartInterrogation }: Props) {
  const { decisions, reflections, patterns } = data
  const activePatterns = patterns.filter(p => !p.dismissed)
  const pendingReflections = reflections.filter(r => !r.completedAt).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 15 }} />
        Decision log
      </div>
      <h2 style={{ marginBottom: 10 }}>Start an interrogation</h2>
      <p className="muted" style={{ marginBottom: 28 }}>
        Six structured questions that push your reasoning until it holds. Every session gets logged automatically.
      </p>

      <div style={{ display: 'flex', gap: 20, marginBottom: 32, fontSize: 13, color: 'var(--fg-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ph-bold ph-signpost" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />
          {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} logged
        </span>
        {activePatterns.length > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue-ink-600)' }}>
            <i className="ph-fill ph-sparkle" style={{ fontSize: 15 }} />
            {activePatterns.length} active pattern{activePatterns.length > 1 ? 's' : ''}
          </span>
        )}
        {pendingReflections > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--warning)' }}>
            <i className="ph ph-clock" style={{ fontSize: 15 }} />
            {pendingReflections} reflection{pendingReflections > 1 ? 's' : ''} due
          </span>
        )}
      </div>

      <div>
        <button className="btn-lime" onClick={onStartInterrogation} style={{ fontSize: 15 }}>
          <i className="ph-bold ph-plus" style={{ fontSize: 15 }} />
          Start interrogation
        </button>
      </div>

    </div>
  )
}
