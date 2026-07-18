'use client'

import { useState } from 'react'
import type { AppData, ReflectionRecord } from '@/types'

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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function Reflections({ data }: Props) {
  const [reflections, setReflections] = useState<ReflectionRecord[]>(data.reflections)
  const [activeReflection, setActiveReflection] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { decisions } = data
  const activePatterns = data.patterns.filter(p => !p.dismissed)

  function getReflectionsForDecision(id: string) {
    return reflections.filter(r => r.decisionId === id)
  }

  function completeReflection(id: string) {
    setReflections(prev =>
      prev.map(r => r.id === id ? { ...r, completedAt: new Date().toISOString(), content: text } : r)
    )
    setActiveReflection(null)
    setText('')
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const pendingCount = reflections.filter(r => !r.completedAt).length

  if (decisions.length === 0) {
    return (
      <div className="screen">
        <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="ph ph-arrow-u-up-left" style={{ fontSize: 15 }} />
          Decisions &amp; reflections
        </div>
        <h2 style={{ marginBottom: 10 }}>Your history</h2>
        <div className="empty" style={{ marginTop: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <i className="ph ph-arrow-u-up-left" style={{ fontSize: 30, color: 'var(--blue-ink-600)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>Nothing logged yet</h3>
          <p className="muted">Decisions you log appear here, with reflections scheduled below each one.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className="ph ph-arrow-u-up-left" style={{ fontSize: 15 }} />
        Decisions &amp; reflections
      </div>
      <h2 style={{ marginBottom: 10 }}>Your history</h2>
      <p className="muted" style={{ marginBottom: 18 }}>Every decision you've logged, with reflections threaded below each one.</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 26, fontSize: 13, color: 'var(--fg-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ph-bold ph-signpost" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />
          {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'}
        </span>
        {pendingCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--warning)' }}>
            <i className="ph ph-clock" style={{ fontSize: 15 }} />
            {pendingCount} reflection{pendingCount > 1 ? 's' : ''} due
          </span>
        )}
      </div>

      {/* Decision cards with threaded reflections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {decisions.map(d => {
          const isExpanded = expanded[d.id]
          const decisionReflections = getReflectionsForDecision(d.id)
          const isLinked = activePatterns.some(p => p.relatedDecisionIds.includes(d.id))

          return (
            <div key={d.id} style={{
              border: `1px solid ${isLinked ? 'var(--blue-ink-100)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              background: isLinked ? 'var(--blue-ink-50)' : 'var(--card)',
              padding: '16px 18px',
            }}>
              {/* Category + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {d.category} · {relativeTime(d.createdAt)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {d.interrogated && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--blue-ink-600)' }}>
                      <i className="ph ph-shield-check" style={{ fontSize: 12 }} />
                      Interrogated
                    </span>
                  )}
                  {isLinked && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      height: 22, padding: '0 9px', borderRadius: 9999, fontSize: 11.5,
                      background: 'var(--blue-ink-100)', color: 'var(--blue-ink-700)',
                    }}>
                      <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
                      Pattern
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--fg)', marginBottom: 8 }}>
                {d.title}
              </div>

              {/* Summary */}
              <div style={{
                fontSize: 14, lineHeight: '22px', color: 'var(--fg-muted)',
                ...(isExpanded ? {} : {
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }),
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

              {/* Reflections thread */}
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 13 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: decisionReflections.length > 0 ? 12 : 0 }}>
                  {decisionReflections.length > 0 ? `REFLECTIONS · ${decisionReflections.length}` : 'NO REFLECTIONS YET'}
                </div>

                {decisionReflections.map(r => {
                  const isPending = !r.completedAt
                  return (
                    <div key={r.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isPending ? 8 : 5 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px',
                          borderRadius: 9999, fontSize: 11.5,
                          background: r.completedAt ? 'rgba(26,122,58,0.10)' : 'var(--muted)',
                          color: r.completedAt ? 'var(--success)' : 'var(--fg-muted)',
                        }}>
                          {r.type === '1month' ? '1-month' : '3-month'} check-in
                          {r.completedAt ? ' · done' : ''}
                        </span>
                        {isPending && (
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            Due {fmt(r.scheduledFor)}
                          </span>
                        )}
                        {r.completedAt && (
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            {fmt(r.completedAt)}
                          </span>
                        )}
                      </div>

                      {r.content && (
                        <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 13, marginBottom: 4 }}>
                          <p style={{ fontSize: 14, lineHeight: '22px', color: 'var(--fg)', fontStyle: 'italic' }}>{r.content}</p>
                        </div>
                      )}

                      {isPending && (
                        activeReflection === r.id ? (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ background: 'var(--blue-ink-50)', border: '1px solid var(--blue-ink-100)', borderRadius: 'var(--radius-md)', padding: '11px 14px' }}>
                              <p style={{ fontSize: 13, color: 'var(--blue-ink-700)', lineHeight: '20px' }}>
                                How did this decision play out? What do you know now that you didn't when you made it?
                              </p>
                            </div>
                            <textarea
                              rows={3}
                              value={text}
                              onChange={e => setText(e.target.value)}
                              placeholder="Write your reflection…"
                              style={{
                                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--input)', background: 'var(--card)',
                                fontSize: 14, lineHeight: '22px', resize: 'none', outline: 'none',
                                width: '100%',
                              }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button className="btn-lime" disabled={!text.trim()} onClick={() => completeReflection(r.id)}>
                                Save
                              </button>
                              <button className="btn-outline" onClick={() => setActiveReflection(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn-outline"
                            onClick={() => { setActiveReflection(r.id); setText('') }}
                            style={{ marginTop: 4, fontSize: 13, height: 34 }}
                          >
                            <i className="ph ph-pencil" style={{ fontSize: 13 }} />
                            Write reflection
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
