'use client'

import { useState } from 'react'
import type { AppData, PatternAlert } from '@/types'

interface Props {
  data: AppData
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const PATTERN_LABELS = [
  { key: 'p1', tab: 'Career vs. alignment' },
  { key: 'p2', tab: 'Binary framing' },
  { key: 'p3', tab: 'External validation' },
]

export function Patterns({ data }: Props) {
  const [patterns, setPatterns] = useState<PatternAlert[]>(data.patterns)
  const [activeTab, setActiveTab] = useState<string | null>(null)

  function dismiss(id: string) {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, dismissed: true } : p))
  }

  const active = patterns.filter(p => !p.dismissed)
  const dismissed = patterns.filter(p => p.dismissed)

  if (patterns.length === 0) {
    return (
      <div className="screen">
        <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="ph ph-chart-line-up" style={{ fontSize: 15 }} />
          Pattern engine
        </div>
        <h2 style={{ marginBottom: 10 }}>Cross-decision patterns</h2>
        <div className="empty" style={{ marginTop: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <i className="ph ph-chart-line-up" style={{ fontSize: 30, color: 'var(--blue-ink-600)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>No patterns yet</h3>
          <p className="muted">Log at least 3 decisions to activate the pattern engine.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className="ph ph-chart-line-up" style={{ fontSize: 15 }} />
        Pattern engine
      </div>
      <h2 style={{ marginBottom: 10 }}>Cross-decision patterns</h2>
      <p className="muted" style={{ marginBottom: 22 }}>
        These patterns emerged from your full decision log. Each section shows the decisions that contributed to it.
      </p>

      {/* ── Pattern tabs ── */}
      {active.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab(null)}
            style={{
              height: 32, padding: '0 14px', borderRadius: 9999, fontSize: 13, cursor: 'pointer',
              border: `1.5px solid ${activeTab === null ? 'var(--blue-ink-500)' : 'var(--border)'}`,
              background: activeTab === null ? 'var(--blue-ink-50)' : 'var(--card)',
              color: activeTab === null ? 'var(--blue-ink-700)' : 'var(--fg-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            All patterns
          </button>
          {active.map(p => {
            const label = PATTERN_LABELS.find(l => l.key === p.id)?.tab ?? p.id
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(prev => prev === p.id ? null : p.id)}
                style={{
                  height: 32, padding: '0 14px', borderRadius: 9999, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${activeTab === p.id ? 'var(--blue-ink-500)' : 'var(--border)'}`,
                  background: activeTab === p.id ? 'var(--blue-ink-50)' : 'var(--card)',
                  color: activeTab === p.id ? 'var(--blue-ink-700)' : 'var(--fg-muted)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Pattern sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {active
          .filter(p => activeTab === null || activeTab === p.id)
          .map((pattern, patternIdx) => {
            const relatedDecisions = pattern.relatedDecisionIds
              .map(id => data.decisions.find(d => d.id === id))
              .filter(Boolean) as typeof data.decisions
            const patternNumber = active.findIndex(p => p.id === pattern.id) + 1

            return (
              <div key={pattern.id}>

                {/* ── Pattern heading ── */}
                <div style={{
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(160deg, var(--blue-ink-50) 0%, var(--card) 100%)',
                  border: '1px solid var(--blue-ink-100)',
                  padding: '20px 22px',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      flexShrink: 0, width: 36, height: 36,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--blue-ink-500)',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    }}>
                      P{patternNumber}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.3, color: 'var(--fg)' }}>
                          {pattern.title}
                        </div>
                        <span style={{
                          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                          height: 22, padding: '0 9px', borderRadius: 9999,
                          background: 'rgba(245,217,138,0.18)', border: '1px solid rgba(245,217,138,0.35)',
                          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#4E6B10',
                        }}>
                          <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
                          Active
                        </span>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: '22px', color: 'var(--fg-muted)', marginBottom: 14 }}>
                        {pattern.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
                          <span style={{ color: 'var(--blue-ink-600)', fontWeight: 600 }}>{relatedDecisions.length}</span> decisions
                        </span>
                        <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
                          Detected {relativeTime(pattern.detectedAt)}
                        </span>
                        <button
                          onClick={() => dismiss(pattern.id)}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            fontSize: 12.5, color: 'var(--fg-muted)', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          <i className="ph ph-x" style={{ fontSize: 13 }} />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Mini-timeline of related decisions ── */}
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 8 }}>
                  {relatedDecisions.map((d, i) => {
                    const isLast = i === relatedDecisions.length - 1

                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>

                        {/* Rail */}
                        <div style={{
                          position: 'relative',
                          width: 32,
                          flexShrink: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}>
                          {!isLast && (
                            <div style={{
                              position: 'absolute',
                              top: 32,
                              bottom: 0,
                              width: 2,
                              background: 'var(--blue-ink-300)',
                            }} />
                          )}
                          <div style={{
                            position: 'relative',
                            zIndex: 1,
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--blue-ink-500)',
                            boxShadow: '0 0 0 4px rgba(59,110,221,0.12)',
                          }}>
                            <i className="ph-bold ph-signpost" style={{ fontSize: 14, color: '#fff' }} />
                          </div>
                        </div>

                        {/* Card */}
                        <div style={{ flex: 1, minWidth: 0, paddingBottom: 22 }}>
                          <div style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--card)',
                            padding: '14px 16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                                {d.category}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {d.interrogated && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--blue-ink-600)' }}>
                                    <i className="ph ph-shield-check" style={{ fontSize: 12 }} />
                                    Interrogated
                                  </span>
                                )}
                                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                                  {relativeTime(d.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.35, color: 'var(--fg)', marginBottom: 8 }}>
                              {d.title}
                            </div>
                            {d.reasoning && (
                              <div style={{
                                fontSize: 13, lineHeight: '20px', color: 'var(--fg-muted)',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                              }}>
                                {d.reasoning}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })}
      </div>

      {/* ── Dismissed ── */}
      {dismissed.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 12 }}>
            Dismissed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dismissed.map(p => (
              <div key={p.id} style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', opacity: 0.45,
                fontSize: 14, color: 'var(--fg)',
              }}>
                {p.title}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
