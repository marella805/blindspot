import { useState } from 'react'
import type { AppData, PatternAlert } from './types'

interface Props {
  data: AppData
}

export function Patterns({ data }: Props) {
  const [patterns, setPatterns] = useState<PatternAlert[]>(data.patterns)

  function dismiss(id: string) {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, dismissed: true } : p))
  }

  function getDecisionTitle(id: string) {
    return data.decisions.find(d => d.id === id)?.title ?? 'Unknown decision'
  }

  const active = patterns.filter(p => !p.dismissed)
  const dismissed = patterns.filter(p => p.dismissed)

  if (patterns.length === 0) {
    return (
      <div className="screen">
        <div>
          <h2>Pattern Engine</h2>
          <div className="divider-line" />
          <p className="lead">Cross-decision patterns detected from your log.</p>
        </div>
        <div className="empty">
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <i className="ph ph-chart-line-up" style={{ fontSize: 30, color: 'var(--blue-ink-600)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>No patterns yet</h3>
          <p className="muted">Log at least 3 decisions to activate the pattern engine. The more you log, the more precise it gets.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div>
        <h2>Pattern Engine</h2>
        <div className="divider-line" />
        <p className="lead">Cross-decision patterns detected from your log. Gets more powerful as your log grows.</p>
      </div>

      {active.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active.map((p, idx) => (
            <div key={p.id} className="pattern-card animate-enter" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="pattern-icon-wrap">
                <i className="ph-fill ph-sparkle" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <strong style={{ fontSize: 15, lineHeight: '22px', color: 'var(--fg)' }}>{p.title}</strong>
                  <span className="badge badge-lime" style={{ flexShrink: 0, fontSize: 11 }}>New</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: '22px', color: 'var(--fg-muted)', marginBottom: 14 }}>{p.description}</p>

                <div style={{ marginBottom: 12 }}>
                  <div className="label-xs" style={{ marginBottom: 8 }}>Related decisions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.relatedDecisionIds.map(id => {
                      const title = getDecisionTitle(id)
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          <i className="ph-bold ph-signpost" style={{ fontSize: 13, color: 'var(--blue-ink-600)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--fg)' }}>{title}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => dismiss(p.id)}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dismissed.length > 0 && (
        <div>
          <div className="label-xs" style={{ marginBottom: 10 }}>Dismissed</div>
          <div className="list">
            {dismissed.map(p => (
              <div key={p.id} className="list-item" style={{ cursor: 'default', opacity: 0.45 }}>
                <span className="list-item-title" style={{ fontSize: 14 }}>{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
