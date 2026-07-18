'use client'

import { useState, useEffect, useRef } from 'react'
import type { AppData } from '@/types'

interface Props {
  data: AppData
  onStartInterrogation: () => void
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
export function DecisionLog({ data, onStartInterrogation }: Props) {
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


    </div>
  )
}
