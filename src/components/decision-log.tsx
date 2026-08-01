'use client'

import { useState, useEffect, useRef } from 'react'
import type { AppData, DecisionEntry } from '@/types'

async function deleteDecision(id: string) {
  const res = await fetch(`/api/decisions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

const CATEGORY_ICONS: Record<string, string> = {
  career: 'ph-briefcase', financial: 'ph-coins', relationship: 'ph-heart',
  health: 'ph-heartbeat', education: 'ph-graduation-cap', housing: 'ph-house',
  business: 'ph-buildings', personal_growth: 'ph-plant', other: 'ph-dots-three',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DecisionCard({ d, onDeleted }: { d: DecisionEntry; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const icon = CATEGORY_ICONS[d.category] ?? 'ph-dots-three'
  const isLocked = !!d.lockedAt

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDecision(d.id)
      onDeleted()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--card)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center',
          gap: 14, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: 'var(--muted)', color: 'var(--fg-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ph ${icon}`} style={{ fontSize: 17 }} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: 'var(--fg)', lineHeight: '21px' }}>{d.title}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{fmt(d.createdAt)}</span>
            {d.interrogated && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue-ink-600)', fontWeight: 500 }}>
                <i className="ph-fill ph-brain" style={{ fontSize: 11 }} />Interrogated
              </span>
            )}
            {isLocked && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                <i className="ph-fill ph-lock-simple" style={{ fontSize: 11 }} />Locked
              </span>
            )}
          </span>
        </span>
        <i
          className={`ph ph-caret-${open ? 'up' : 'down'}`}
          style={{ fontSize: 15, color: 'var(--fg-muted)', flexShrink: 0, transition: 'transform 200ms' }}
        />
      </button>
      <button
        type="button"
        onClick={() => setConfirming(c => !c)}
        title="Delete decision"
        style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 'var(--radius-md)',
          border: `1px solid ${confirming ? 'rgba(192,57,43,0.4)' : 'var(--border)'}`,
          cursor: 'pointer', marginRight: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: confirming ? 'rgba(192,57,43,0.1)' : 'var(--muted)',
          color: confirming ? '#C0392B' : 'var(--fg)',
          transition: 'background 150ms, color 150ms, border-color 150ms',
        }}
      >
        <i className="ph-fill ph-trash" style={{ fontSize: 15 }} />
      </button>
      </div>

      {/* Inline delete confirmation */}
      {confirming && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 18px',
          background: 'rgba(192,57,43,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ flex: 1, fontSize: 13.5, color: 'var(--fg)' }}>
            Delete this decision? This can&apos;t be undone.
          </span>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--fg-muted)', padding: '0 4px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 14px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: deleting ? 'not-allowed' : 'pointer',
              background: '#C0392B', color: '#fff', fontSize: 13, fontWeight: 500,
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <i className="ph-fill ph-trash" style={{ fontSize: 13 }} />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary */}
          {d.summary && (
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 6 }}>CONTEXT</div>
              <p style={{ fontSize: 14, lineHeight: '22px', color: 'var(--fg)', margin: 0 }}>{d.summary}</p>
            </div>
          )}

          {/* Options */}
          {d.options.length > 0 && (
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 8 }}>OPTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.options.map((o, i) => (
                  <div
                    key={o.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${d.chosenOption === o.id ? 'var(--success)' : 'var(--border)'}`,
                      background: d.chosenOption === o.id ? 'rgba(34,197,94,0.05)' : 'var(--muted)',
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)',
                      width: 18, height: 18, borderRadius: 4, background: 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--fg)', flex: 1 }}>{o.label}</span>
                    {d.chosenOption === o.id && (
                      <i className="ph-fill ph-check-circle" style={{ fontSize: 15, color: 'var(--success)', flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {d.recommendation && (
            <div style={{
              padding: '14px 16px',
              background: 'var(--blue-ink-50)',
              border: '1px solid var(--blue-ink-100)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, fontSize: 12, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', fontWeight: 500 }}>
                <i className="ph-fill ph-sparkle" style={{ fontSize: 13 }} />
                BLINDSPOT RECOMMENDATION
              </div>
              <p style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--blue-ink-900)', margin: '0 0 6px' }}>{d.recommendation.answer}</p>
              <p style={{ fontSize: 13.5, lineHeight: '21px', color: 'var(--blue-ink-800)', margin: 0 }}>{d.recommendation.rationale}</p>
              {d.recommendation.evidence.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {d.recommendation.evidence.map((e, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--blue-ink-700)', lineHeight: '20px' }}>
                      <span style={{ fontWeight: 600 }}>{e.pattern}:</span> {e.finding}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

interface Props {
  data: AppData
  onStartInterrogation: () => void
  onDeleteDecision: () => void
}

// ── Count-up animation ──────────────────────────────────────────────────────
function CountUp({ to, suffix = '', duration = 1100 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current || to === 0) { setVal(to); return }
    started.current = true
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(eased * to))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, duration])
  return <>{val}{suffix}</>
}

// ── Main component ──────────────────────────────────────────────────────────
export function DecisionLog({ data, onStartInterrogation, onDeleteDecision }: Props) {
  const { decisions, reflections, patterns, profile } = data
  const isFresh = decisions.length === 0

  const activePatterns = patterns.filter(p => !p.dismissed)
  const pendingReflections = reflections.filter(r => !r.completedAt)
  const interrogatedCount = decisions.filter(d => d.interrogated).length
  const completedReflections = reflections.filter(r => r.completedAt).length

  // Readiness checks
  const checks = isFresh
    ? [
        { ok: false, label: 'Log your first decision' },
        { ok: false, label: 'Complete an AI interrogation' },
        { ok: false, label: 'Unlock your first pattern' },
      ]
    : [
        { ok: true,  label: 'Profile complete' },
        { ok: true,  label: 'First decision logged' },
        { ok: interrogatedCount > 0, label: 'AI interrogation done' },
        { ok: pendingReflections.length === 0, label: pendingReflections.length === 0 ? 'Reflections current' : `Reflections current (${pendingReflections.length} overdue)` },
        { ok: activePatterns.length > 0, label: 'Pattern review active' },
      ]

  const readinessPct = isFresh ? 0 : Math.round((checks.filter(c => c.ok).length / checks.length) * 100)

  // Bar animates in after mount
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(readinessPct), 80)
    return () => clearTimeout(t)
  }, [readinessPct])

  return (
    <div className="screen">

      {/* ── Alert Banner ── */}
      {!isFresh && pendingReflections.length > 0 && (
        <div className="alert-banner">
          <i className="ph-fill ph-warning alert-banner-icon" />
          <span className="alert-banner-text">
            {pendingReflections.length} reflection{pendingReflections.length > 1 ? 's' : ''} overdue — check in on past decisions before logging new ones.
          </span>
        </div>
      )}

      {/* ── Hero Card ── */}
      <div className="hero-card">
        <div className="hero-grid">
          <div>
            <div className="hero-kpi-label">
              {isFresh ? 'Decisions Logged' : 'Decision Calibration'}
            </div>
            <div className="hero-kpi-number">
              {isFresh
                ? '0'
                : <><CountUp to={profile.calibration} /><span style={{ fontSize: 40 }}>%</span></>
              }
            </div>
            {!isFresh && (
              <div className="hero-kpi-unit">
                {decisions.length} decision{decisions.length !== 1 ? 's' : ''} · {interrogatedCount} interrogated
              </div>
            )}
            {isFresh && (
              <div className="hero-kpi-unit">Start your first interrogation</div>
            )}
          </div>

          <div>
            <div className="readiness-label">Readiness</div>
            <div className="readiness-pct">{readinessPct}%</div>
            <div className="readiness-bar-track">
              <div className="readiness-bar-fill" style={{ width: `${barWidth}%` }} />
            </div>
            <div className="readiness-checks">
              {checks.map((c, i) => (
                <div key={i} className={`readiness-check ${c.ok ? 'ok' : ''}`}>
                  <span className="readiness-dot" />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {!isFresh && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-number"><CountUp to={decisions.length} /></div>
            <div className="kpi-label">Decisions</div>
            <div className="kpi-delta">
              <i className="ph ph-trend-up" style={{ fontSize: 12 }} />
              +{decisions.filter(d => {
                const diff = Date.now() - new Date(d.createdAt).getTime()
                return diff < 30 * 86400000
              }).length} this month
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-number"><CountUp to={profile.calibration} suffix="%" /></div>
            <div className="kpi-label">Calibration</div>
            <div className="kpi-delta">
              <i className="ph ph-arrow-up" style={{ fontSize: 12 }} />
              Above avg
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-number"><CountUp to={interrogatedCount} /></div>
            <div className="kpi-label">Interrogated</div>
            <div className="kpi-delta">
              <i className="ph ph-magnifying-glass" style={{ fontSize: 12 }} />
              {Math.round((interrogatedCount / Math.max(decisions.length, 1)) * 100)}% rate
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-number"><CountUp to={activePatterns.length} /></div>
            <div className="kpi-label">Active Patterns</div>
            {pendingReflections.length > 0
              ? <div className="kpi-delta warn"><i className="ph ph-clock" style={{ fontSize: 12 }} />{pendingReflections.length} overdue</div>
              : <div className="kpi-delta"><i className="ph ph-check" style={{ fontSize: 12 }} />Reflections current</div>
            }
          </div>
        </div>
      )}

      {/* ── Start Interrogation CTA ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 14 }} />
            Decision log
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
            {isFresh
              ? 'Six structured questions that stress-test your reasoning. Every session is logged automatically.'
              : `${decisions.length} decision${decisions.length !== 1 ? 's' : ''} logged · ${completedReflections} reflection${completedReflections !== 1 ? 's' : ''} completed`
            }
          </div>
        </div>
        <button className="btn-lime" onClick={onStartInterrogation} style={{ flexShrink: 0 }}>
          <i className="ph-bold ph-plus" style={{ fontSize: 14 }} />
          Start interrogation
          <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 2 }}>+150 XP</span>
        </button>
      </div>

      {/* ── Decision List ── */}
      {decisions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {decisions.map(d => <DecisionCard key={d.id} d={d} onDeleted={onDeleteDecision} />)}
        </div>
      )}

    </div>
  )
}
