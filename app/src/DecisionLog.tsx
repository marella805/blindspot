import { useState } from 'react'
import type { AppData, DecisionEntry } from './types'

interface Props {
  data: AppData
  onStartInterrogation: () => void
}

const DOMAIN_COLOR: Record<string, string> = {
  Education: 'var(--blue-ink-600)',
  Career:    '#c45000',
  Personal:  '#6A1B9A',
  Financial: 'var(--success)',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function DecisionLog({ data, onStartInterrogation }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { decisions, reflections, patterns } = data

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function getReflectionsForDecision(id: string) {
    return reflections.filter(r => r.decisionId === id)
  }

  const totalReflections = reflections.length
  const activePatternCount = patterns.filter(p => !p.dismissed).length

  if (decisions.length === 0) {
    return (
      <div className="screen">
        <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 15 }} />
          Your history
        </div>
        <div>
          <h2 style={{ marginBottom: 10 }}>Decisions &amp; reflections</h2>
          <p className="muted">Every decision you log appears here, with reflections threaded below each one.</p>
        </div>
        <div className="empty">
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <i className="ph ph-scales" style={{ fontSize: 30, color: 'var(--blue-ink-600)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>No decisions yet</h3>
          <p className="muted">Start an interrogation to log your first high-stakes decision.</p>
          <button className="btn-lime" onClick={onStartInterrogation} style={{ marginTop: 8 }}>
            Start interrogation<i className="ph-bold ph-arrow-right" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 15 }} />
        Your history
      </div>
      <h2 style={{ marginBottom: 10 }}>Decisions &amp; reflections</h2>
      <p className="muted" style={{ marginBottom: 18 }}>Every decision you've logged, newest first. Come back to add a reflection when the outcome plays out.</p>

      <div style={{ display: 'flex', gap: 20, marginBottom: 26, fontSize: 13, color: 'var(--fg-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ph-bold ph-signpost" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />
          {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ph ph-arrows-counter-clockwise" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />
          {totalReflections} reflections logged
        </span>
      </div>

      {/* Pattern insight banner */}
      {activePatternCount > 0 && (
        <div style={{ border: '1px solid var(--blue-ink-100)', borderRadius: 'var(--radius-lg)', background: 'var(--blue-ink-50)', padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="ph-fill ph-sparkle" style={{ fontSize: 16, color: 'var(--blue-ink-600)', marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', marginBottom: 5 }}>
              Pattern surfaced — {patterns.filter(p => !p.dismissed)[0]?.title}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: '21px', color: 'var(--blue-ink-800)' }}>
              {patterns.filter(p => !p.dismissed)[0]?.description.slice(0, 120)}…
              {' '}The connected entries are highlighted on the timeline below.
            </div>
          </div>
        </div>
      )}

      {/* New decision button */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn-lime" onClick={onStartInterrogation}>
          <i className="ph-bold ph-plus" style={{ fontSize: 15 }} />
          New decision
        </button>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {decisions.map((d, i) => {
          const isExpanded = expanded[d.id]
          const decisionReflections = getReflectionsForDecision(d.id)
          const isLast = i === decisions.length - 1
          const isLinked = patterns.some(p => !p.dismissed && p.relatedDecisionIds.includes(d.id))

          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'stretch', gap: 16 }}>
              {/* Rail */}
              <div style={{ position: 'relative', width: 36, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute', top: 34, bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: isLinked ? 3 : 2,
                    background: isLinked ? 'var(--blue-ink-400)' : 'var(--border)',
                  }} />
                )}
                <div style={{
                  position: 'relative', zIndex: 1,
                  width: 34, height: 34, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  background: isLinked ? 'var(--blue-ink-500)' : d.lockedAt ? 'var(--fg-muted)' : 'var(--blue-ink-950)',
                  border: `1.5px solid ${isLinked ? 'var(--blue-ink-500)' : d.lockedAt ? 'var(--fg-muted)' : 'var(--blue-ink-950)'}`,
                  boxShadow: isLinked ? '0 0 0 4px rgba(78,61,99,0.16)' : 'none',
                }}>
                  <i
                    className={d.lockedAt ? 'ph-fill ph-lock-simple' : 'ph-bold ph-signpost'}
                    style={{ fontSize: 16, color: '#fff' }}
                  />
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 32 }}>
                <div style={{
                  borderRadius: 'var(--radius-lg)',
                  background: isLinked ? 'var(--blue-ink-50)' : undefined,
                  border: isLinked ? '1px solid var(--blue-ink-100)' : undefined,
                  padding: isLinked ? '14px 16px' : '0',
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                      {d.category} · Decision
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      height: 23, padding: '0 10px', borderRadius: 9999, fontSize: 12,
                      background: d.lockedAt ? 'var(--muted)' : isLinked ? 'var(--blue-ink-100)' : 'rgba(26,122,58,0.10)',
                      color: d.lockedAt ? 'var(--fg-muted)' : isLinked ? 'var(--blue-ink-700)' : 'var(--success)',
                    }}>
                      <i className={d.lockedAt ? 'ph ph-lock-simple' : isLinked ? 'ph-fill ph-sparkle' : 'ph-fill ph-check-circle'} style={{ fontSize: 12 }} />
                      {d.lockedAt ? 'Closed' : isLinked ? 'Pattern' : 'Decided'}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--fg)', marginBottom: 8 }}>
                    {d.title}
                  </div>

                  {/* Summary */}
                  <div style={{
                    fontSize: 14, lineHeight: '22px', color: 'var(--fg-muted)',
                    display: isExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: isExpanded ? undefined : 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: isExpanded ? 'visible' : 'hidden',
                  }}>
                    {d.summary}
                  </div>
                  {d.summary.length > 120 && (
                    <button
                      onClick={() => toggleExpand(d.id)}
                      style={{ background: 'none', border: 'none', padding: 0, marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--blue-ink-600)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <i className={isExpanded ? 'ph ph-caret-up' : 'ph ph-caret-down'} style={{ fontSize: 13 }} />
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}

                  {/* Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
                      <i className="ph ph-calendar-blank" style={{ fontSize: 13 }} />
                      Decided {relativeTime(d.createdAt)}
                    </span>
                    {d.interrogated && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--blue-ink-600)' }}>
                        <i className="ph ph-shield-check" style={{ fontSize: 13 }} />
                        Interrogated
                      </span>
                    )}
                  </div>

                  {/* Reflections thread */}
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: decisionReflections.length > 0 ? 'var(--fg)' : 'var(--fg-muted)', marginBottom: decisionReflections.length > 0 ? 10 : 0 }}>
                      <i className={decisionReflections.length > 0 ? 'ph-fill ph-arrows-counter-clockwise' : 'ph ph-arrows-counter-clockwise'} style={{ fontSize: 14 }} />
                      {decisionReflections.length > 0
                        ? `Reflections · ${decisionReflections.length}`
                        : 'No reflections yet'}
                    </div>

                    {decisionReflections.map(r => (
                      <div key={r.id} style={{ display: 'flex', gap: 11, paddingBottom: 13 }}>
                        <div style={{ width: 9, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
                          <i className="ph-fill ph-circle" style={{ fontSize: 6, color: 'var(--border)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
                              borderRadius: 9999, fontSize: 11,
                              background: r.completedAt ? 'rgba(26,122,58,0.10)' : 'var(--muted)',
                              color: r.completedAt ? 'var(--success)' : 'var(--fg-muted)',
                            }}>
                              {r.type === '1month' ? '1-month' : '3-month'} check-in
                            </span>
                            {r.completedAt && <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Completed</span>}
                          </div>
                          {r.content ? (
                            <div style={{ fontSize: 13.5, lineHeight: '21px', color: 'var(--fg)' }}>{r.content}</div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>
                              Due {new Date(r.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {d.lockedAt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-md)', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        <i className="ph ph-lock-simple" style={{ fontSize: 14 }} />
                        Closed — no further reflections on this decision.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
