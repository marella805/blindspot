'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DemoPicker } from '@/components/demo-picker'
import { Profile } from '@/components/profile'
import { DecisionInterrogation } from '@/components/decision-interrogation'
import { DecisionLog } from '@/components/decision-log'
import { Reflections } from '@/components/reflections'
import { Patterns } from '@/components/patterns'
import { freshData, seasonedData, sampleInterrogation } from '@/lib/demo-data'
import type { AppData, DemoMode, Screen } from '@/types'

// ── XP system ────────────────────────────────────────────────────────────────

const LEVELS = [
  { level: 1, tier: 'Novice',     min: 0,    max: 150  },
  { level: 2, tier: 'Apprentice', min: 150,  max: 400  },
  { level: 3, tier: 'Analyst',    min: 400,  max: 750  },
  { level: 4, tier: 'Strategist', min: 750,  max: 1250 },
  { level: 5, tier: 'Senior',     min: 1250, max: 1950 },
  { level: 6, tier: 'Expert',     min: 1950, max: 2800 },
  { level: 7, tier: 'Master',     min: 2800, max: 99999 },
]

function computeXP(data: AppData, bonus = 0) {
  const raw =
    data.decisions.length * 100 +
    data.decisions.filter(d => d.interrogated).length * 75 +
    data.reflections.filter(r => r.completedAt).length * 50 +
    data.patterns.filter(p => p.dismissed).length * 25
  const total = raw + bonus
  let lvl = LEVELS[0]
  for (const l of LEVELS) {
    if (total >= l.min) lvl = l
    else break
  }
  const xpInLevel = total - lvl.min
  const xpForLevel = lvl.level === 7 ? 9999 : lvl.max - lvl.min
  return { total, level: lvl.level, tier: lvl.tier, xpInLevel, xpForLevel }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface XPFloat { id: number; amount: number }
interface AIMessage { role: 'assistant' | 'user'; content: string }

const NAV = [
  { id: 'log',         label: 'Decision Maker',   icon: 'ph-fill ph-scales'     },
  { id: 'reflections', label: 'Reflections', icon: 'ph ph-arrow-u-up-left' },
  { id: 'patterns',    label: 'Patterns',    icon: 'ph ph-chart-line-up'   },
  { id: 'profile',     label: 'Profile',     icon: 'ph ph-user'            },
] as const

function getActiveData(mode: DemoMode): AppData {
  return mode === 'seasoned' ? seasonedData : freshData
}

// ── AI canned responses ───────────────────────────────────────────────────────

const AI_RESPONSES = [
  "Based on your decision log, you're consistently anchoring to career signals over personal alignment — this shows up in 4 of your 6 decisions. Your pattern P1 captures this directly. Want to dig into the Stripe vs. AI Lab decision?",
  "Your 3-month reflection on the Berkeley decision is overdue. Completing it would close the feedback loop and earn you 50 XP. I can draft some reflection prompts if you'd like.",
  "Your calibration is at 82% — that's strong. The remaining gap is mostly from incomplete reflections. Finishing the 2 pending ones could push you above 90%.",
]

let aiResponseIdx = 0

// ── Component ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [demoMode, setDemoMode] = useState<DemoMode>('picker')
  const [screen, setScreen] = useState<Screen>('log')

  // XP state
  const floatCounter = useRef(0)
  const [xpFloats, setXpFloats] = useState<XPFloat[]>([])
  const [bonusXP, setBonusXP] = useState(0)
  const [levelUpTier, setLevelUpTier] = useState<string | null>(null)
  const [levelUpLeaving, setLevelUpLeaving] = useState(false)
  const [barAnimated, setBarAnimated] = useState(false)

  // Command palette
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdQuery, setCmdQuery] = useState('')
  const [cmdIdx, setCmdIdx] = useState(0)
  const cmdInputRef = useRef<HTMLInputElement>(null)

  // AI assistant
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiTyping, setAiTyping] = useState(false)
  const aiBodyRef = useRef<HTMLDivElement>(null)

  // Daily challenges state
  const [challenge1Done, setChallenge1Done] = useState(false)

  // Animate XP bar on mode switch
  useEffect(() => {
    setBarAnimated(false)
    const t = setTimeout(() => setBarAnimated(true), 100)
    return () => clearTimeout(t)
  }, [demoMode])

  // Pre-load AI context message when panel opens
  useEffect(() => {
    if (aiOpen && aiMessages.length === 0 && demoMode !== 'picker') {
      const isFresh = demoMode === 'fresh'
      setAiMessages([{
        role: 'assistant',
        content: isFresh
          ? "Welcome to Blindspot. I'm here to help you think through high-stakes decisions. Log your first decision and I'll guide you through an AI interrogation to stress-test your reasoning."
          : "I've reviewed your 6 logged decisions. You have 2 pending reflections — your Berkeley 3-month check-in and your Stripe internship 1-month check-in are both overdue. I also spotted 3 active patterns in your decision-making. Where would you like to start?",
      }])
    }
  }, [aiOpen, demoMode])

  // Scroll AI body to bottom
  useEffect(() => {
    if (aiBodyRef.current) {
      aiBodyRef.current.scrollTop = aiBodyRef.current.scrollHeight
    }
  }, [aiMessages, aiTyping])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (demoMode === 'picker') return
        setCmdOpen(prev => !prev)
        setCmdQuery('')
        setCmdIdx(0)
      }
      if (e.key === 'Escape') {
        setCmdOpen(false)
        setAiOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [demoMode])

  // Focus command input when opened
  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 40)
    }
  }, [cmdOpen])

  // ── XP trigger ─────────────────────────────────────────────────────────────

  const triggerXP = useCallback((amount: number) => {
    if (demoMode === 'picker' || demoMode === 'fresh') return
    const data = getActiveData(demoMode)
    const headstart = 250
    const before = computeXP(data, bonusXP + headstart)
    const after  = computeXP(data, bonusXP + amount + headstart)

    setBonusXP(prev => prev + amount)

    const id = ++floatCounter.current
    setXpFloats(prev => [...prev, { id, amount }])
    setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== id)), 2200)

    if (after.level > before.level) {
      setLevelUpTier(after.tier)
      setLevelUpLeaving(false)
      setTimeout(() => setLevelUpLeaving(true), 3800)
      setTimeout(() => setLevelUpTier(null), 4200)
    }
  }, [demoMode, bonusXP])

  // ── Command palette items ──────────────────────────────────────────────────

  const data = demoMode !== 'picker' ? getActiveData(demoMode) : null

  const CMD_ITEMS = [
    { section: 'Navigate', icon: 'ph-fill ph-scales',        label: 'Decision Log',        hint: '',       action: () => { setScreen('log');         setCmdOpen(false) } },
    { section: 'Navigate', icon: 'ph ph-arrow-u-up-left',    label: 'Reflections',         hint: '',       action: () => { setScreen('reflections'); setCmdOpen(false) } },
    { section: 'Navigate', icon: 'ph ph-chart-line-up',      label: 'Patterns',            hint: '',       action: () => { setScreen('patterns');    setCmdOpen(false) } },
    { section: 'Navigate', icon: 'ph ph-user',               label: 'Profile',             hint: '',       action: () => { setScreen('profile');     setCmdOpen(false) } },
    { section: 'Actions',  icon: 'ph-bold ph-plus',          label: 'Start Interrogation', hint: '+150 XP', action: () => { handleStartInterrogation(); setCmdOpen(false) } },
    { section: 'Actions',  icon: 'ph ph-arrows-clockwise',   label: 'Switch Demo Mode',    hint: '',       action: () => { setCmdOpen(false); setDemoMode('picker') } },
    { section: 'Actions',  icon: 'ph ph-robot',              label: 'Open AI Assistant',   hint: '',       action: () => { setAiOpen(true); setCmdOpen(false) } },
    ...(data?.decisions.slice(0, 3).map(d => ({
      section: 'Recent',
      icon: 'ph ph-clock-counter-clockwise',
      label: d.title.slice(0, 52) + (d.title.length > 52 ? '…' : ''),
      hint: d.category,
      action: () => { setScreen('log'); setCmdOpen(false) },
    })) ?? []),
  ]

  const filteredItems = cmdQuery.trim()
    ? CMD_ITEMS.filter(i => i.label.toLowerCase().includes(cmdQuery.toLowerCase()) || i.section.toLowerCase().includes(cmdQuery.toLowerCase()))
    : CMD_ITEMS

  // ── AI send ────────────────────────────────────────────────────────────────

  function sendAI(e?: React.FormEvent) {
    e?.preventDefault()
    const text = aiInput.trim()
    if (!text || aiTyping) return
    setAiMessages(prev => [...prev, { role: 'user', content: text }])
    setAiInput('')
    setAiTyping(true)
    setTimeout(() => {
      setAiTyping(false)
      const response = AI_RESPONSES[aiResponseIdx % AI_RESPONSES.length]
      aiResponseIdx++
      setAiMessages(prev => [...prev, { role: 'assistant', content: response }])
    }, 1100 + Math.random() * 400)
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleStartInterrogation() {
    setScreen('interrogation')
    triggerXP(150)
    setChallenge1Done(false)
  }

  function handleInterrogationComplete() {
    setScreen('log')
    triggerXP(175)
  }

  // ── Picker screen ──────────────────────────────────────────────────────────

  if (demoMode === 'picker') {
    return <DemoPicker onSelect={mode => { setDemoMode(mode); setScreen('log'); setBonusXP(0) }} />
  }

  // ── Main app ───────────────────────────────────────────────────────────────

  const isFresh = demoMode === 'fresh'
  const activeData = getActiveData(demoMode)
  // Give seasoned user a head-start so the first action triggers a level-up
  const xpBonus = isFresh ? 0 : bonusXP + 250
  const xp = computeXP(activeData, xpBonus)
  const xpBarPct = barAnimated ? Math.round((xp.xpInLevel / xp.xpForLevel) * 100) : 0

  const pendingReflections = activeData.reflections.filter(r => !r.completedAt).length
  const activePatterns = activeData.patterns.filter(p => !p.dismissed).length

  const topbarTitle =
    screen === 'interrogation' ? (isFresh ? sampleInterrogation.title : 'New interrogation') :
    screen === 'log'           ? 'Decision Log' :
    screen === 'reflections'   ? 'Reflections' :
    screen === 'patterns'      ? 'Patterns' :
                                 'Profile'

  // Streak
  const streak = isFresh ? 1 : 12

  // Daily challenges
  const challenges = isFresh
    ? [
        { label: 'Start your first interrogation', done: false },
        { label: 'Explore the demo', done: true },
      ]
    : [
        { label: 'Complete a reflection', done: challenge1Done },
        { label: 'Log a decision', done: true },
      ]

  return (
    <>
      <div className="app">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sb-header">
            <span className="sb-wordmark">Blindspot</span>
            <button className="sb-collapse" aria-label="Collapse">
              <i className="ph-bold ph-caret-double-left" style={{ fontSize: 15 }} />
            </button>
          </div>

          <div className="sb-user">
            <div className="sb-avatar-ring">
              <svg viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                {activeData.profile.calibration > 0 && (
                  <circle cx="42" cy="42" r="38" fill="none" stroke="#F5D98A" strokeWidth="4"
                    strokeLinecap="round" strokeDasharray="238.8"
                    strokeDashoffset={238.8 - (238.8 * activeData.profile.calibration / 100)} />
                )}
              </svg>
              <span className="sb-avatar-inner">{activeData.profile.initials}</span>
              {(pendingReflections + activePatterns) > 0 && (
                <span className="sb-avatar-badge">{pendingReflections + activePatterns}</span>
              )}
            </div>
            <div className="sb-name">{activeData.profile.name}</div>
            {activeData.profile.calibration > 0 ? (
              <div className="sb-calibration">
                <span className="sb-dot" />
                Calibration {activeData.profile.calibration}%
              </div>
            ) : (
              <div className="sb-calibration" style={{ color: '#B0A4CC' }}>
                <span className="sb-dot" style={{ background: '#B0A4CC' }} />
                Not yet calibrated
              </div>
            )}
          </div>

          <div className="sb-divider" />

          <nav className="sb-nav">
            {NAV.map(item => {
              const badge =
                item.id === 'reflections' ? pendingReflections :
                item.id === 'patterns'    ? activePatterns :
                null
              const isActive = screen === item.id || (screen === 'interrogation' && item.id === 'log')
              return (
                <button
                  key={item.id}
                  className={`sb-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setScreen(item.id as Screen)}
                >
                  <span className="sb-nav-icon">
                    <i className={item.icon} style={{ fontSize: 17 }} />
                  </span>
                  {item.label}
                  {badge !== null && badge > 0 && (
                    <span className="sb-nav-badge">{badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {pendingReflections > 0 ? (
            <div className="sb-followup" onClick={() => setScreen('reflections')} style={{ cursor: 'pointer' }}>
              <div className="sb-followup-header">
                <span className="sb-dot" />
                <span className="sb-followup-label">{pendingReflections} follow-up{pendingReflections > 1 ? 's' : ''} due</span>
                <i className="ph-bold ph-caret-up" style={{ fontSize: 13, color: '#D4A830' }} />
              </div>
              <div className="sb-followup-body">
                {activeData.decisions.find(d => d.id === activeData.reflections.find(r => !r.completedAt)?.decisionId)?.title?.slice(0, 50)?.concat('…') ?? 'A past decision is ready for its check-in.'}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#B0A4CC', marginBottom: 4 }}>Demo mode</div>
              <button
                onClick={() => setDemoMode('picker')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F5D98A', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <i className="ph ph-arrows-clockwise" style={{ fontSize: 13 }} />
                Switch view
              </button>
            </div>
          )}

          {demoMode === 'seasoned' && (
            <div style={{ marginTop: 8, padding: '10px 14px' }}>
              <button
                onClick={() => setDemoMode('picker')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0A4CC', fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <i className="ph ph-arrows-clockwise" style={{ fontSize: 12 }} />
                Switch demo view
              </button>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div className="main-area">
          {/* Topbar */}
          <header className="topbar">
            <div className="row gap-2">
              <i className="ph ph-arrow-left" style={{ fontSize: 16, color: 'var(--fg-muted)' }} />
              <span className="topbar-title">{topbarTitle}</span>
              {screen === 'interrogation' && <span className="topbar-badge">Draft</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setCmdOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  height: 30, padding: '0 12px', borderRadius: 8,
                  background: 'var(--muted)', border: '1px solid var(--border)',
                  fontSize: 12.5, color: 'var(--fg-muted)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <i className="ph ph-magnifying-glass" style={{ fontSize: 13 }} />
                Search…
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  fontSize: 10, color: 'var(--fg-muted)', opacity: 0.7, marginLeft: 2,
                }}>
                  <span style={{ background: 'var(--border)', padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>⌘</span>
                  <span style={{ background: 'var(--border)', padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>K</span>
                </span>
              </button>
              <button className="topbar-save" onClick={() => setDemoMode('picker')}>
                <i className="ph ph-arrows-clockwise" style={{ fontSize: 15 }} />
                {isFresh ? 'Fresh view' : 'Seasoned view'}
              </button>
            </div>
          </header>

          {/* XP Strip */}
          <div className="xp-strip">
            <span className="xp-level-badge">LVL {xp.level}</span>
            <span className="xp-tier">{xp.tier}</span>
            <div className="xp-bar-wrap">
              <div className="xp-bar-track">
                <div className="xp-bar-fill" style={{ width: `${xpBarPct}%` }} />
              </div>
              <span className="xp-fraction">{xp.xpInLevel}/{xp.xpForLevel} XP</span>
            </div>
            <span className="xp-sep" />
            <span className="xp-streak">
              <i className="ph-fill ph-fire xp-streak-fire" />
              <span className="xp-streak-count">{streak}</span>
              <span>day streak</span>
            </span>
            <span className="xp-sep" />
            <div className="xp-challenges">
              {challenges.map((c, i) => (
                <span key={i} className={`xp-challenge ${c.done ? 'done' : ''}`}>
                  <span className="xp-check-box">
                    {c.done && <i className="ph-bold ph-check" />}
                  </span>
                  <span className="xp-challenge-label">{c.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          {screen === 'interrogation' ? (
            <DecisionInterrogation
              isFresh={isFresh}
              patterns={activeData.patterns}
              decisions={activeData.decisions}
              onComplete={handleInterrogationComplete}
            />
          ) : (
            <div className="content">
              <div className="content-inner animate-enter" key={screen}>
                {screen === 'log'         && <DecisionLog data={activeData} onStartInterrogation={handleStartInterrogation} />}
                {screen === 'reflections' && <Reflections data={activeData} />}
                {screen === 'patterns'    && <Patterns data={activeData} />}
                {screen === 'profile'     && <Profile data={activeData} isFresh={isFresh} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── XP Float Pills ── */}
      {xpFloats.map(f => (
        <div key={f.id} className="xp-float-pill">
          <i className="ph-fill ph-lightning" style={{ fontSize: 11 }} />
          +{f.amount} XP
        </div>
      ))}

      {/* ── Level-Up Toast ── */}
      {levelUpTier && (
        <div className={`levelup-toast ${levelUpLeaving ? 'leaving' : ''}`}>
          <div className="levelup-toast-label">Level Up!</div>
          <div className="levelup-toast-title">You're now a {levelUpTier}</div>
          <div className="levelup-toast-sub">Keep interrogating your decisions to advance further.</div>
        </div>
      )}

      {/* ── Command Palette ── */}
      {cmdOpen && (
        <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="cmd-panel" onClick={e => e.stopPropagation()}>
            <div className="cmd-input-row">
              <i className="ph ph-magnifying-glass cmd-search-icon" />
              <input
                ref={cmdInputRef}
                value={cmdQuery}
                onChange={e => { setCmdQuery(e.target.value); setCmdIdx(0) }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIdx(i => Math.min(i + 1, filteredItems.length - 1)) }
                  if (e.key === 'ArrowUp')   { e.preventDefault(); setCmdIdx(i => Math.max(i - 1, 0)) }
                  if (e.key === 'Enter')      { filteredItems[cmdIdx]?.action?.() }
                  if (e.key === 'Escape')     { setCmdOpen(false) }
                }}
                placeholder="Search actions and decisions…"
                autoComplete="off"
              />
            </div>
            <div className="cmd-results">
              {(() => {
                const sections: Record<string, typeof filteredItems> = {}
                for (const item of filteredItems) {
                  if (!sections[item.section]) sections[item.section] = []
                  sections[item.section].push(item)
                }
                let globalIdx = 0
                return Object.entries(sections).map(([section, items]) => (
                  <div key={section}>
                    <div className="cmd-section-label">{section}</div>
                    {items.map(item => {
                      const idx = globalIdx++
                      return (
                        <div
                          key={item.label}
                          className={`cmd-item ${cmdIdx === idx ? 'active' : ''}`}
                          onMouseEnter={() => setCmdIdx(idx)}
                          onClick={item.action}
                        >
                          <span className="cmd-item-icon">
                            <i className={item.icon} style={{ fontSize: 14 }} />
                          </span>
                          <span className="cmd-item-label">{item.label}</span>
                          {item.hint && <span className="cmd-item-hint">{item.hint}</span>}
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}
              {filteredItems.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13.5 }}>
                  No results for "{cmdQuery}"
                </div>
              )}
            </div>
            <div className="cmd-footer">
              <span><span className="cmd-key">↑</span><span className="cmd-key">↓</span> Navigate</span>
              <span><span className="cmd-key">↵</span> Select</span>
              <span><span className="cmd-key">Esc</span> Close</span>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Assistant ── */}
      {aiOpen && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <span className="ai-panel-dot" />
              Blindspot AI
            </div>
            <button className="ai-panel-close" onClick={() => setAiOpen(false)}>
              <i className="ph ph-x" />
            </button>
          </div>
          <div className="ai-panel-body" ref={aiBodyRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>{m.content}</div>
            ))}
            {aiTyping && <div className="ai-typing">···</div>}
          </div>
          <form className="ai-panel-footer" onSubmit={sendAI}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask about your decisions…"
              autoFocus
            />
            <button type="submit" className="ai-send" disabled={!aiInput.trim() || aiTyping}>
              <i className="ph-bold ph-paper-plane-tilt" style={{ fontSize: 14 }} />
            </button>
          </form>
        </div>
      )}

      <button className="ai-fab" onClick={() => setAiOpen(prev => !prev)} aria-label="AI Assistant">
        {aiOpen
          ? <i className="ph-bold ph-x" style={{ fontSize: 20 }} />
          : <i className="ph-fill ph-robot" style={{ fontSize: 22 }} />
        }
      </button>
    </>
  )
}
