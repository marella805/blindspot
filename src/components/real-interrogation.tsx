'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'

type CoachingStyle = 'advisor' | 'supporter' | 'critic'

interface SessionData {
  decisionId: string
  sessionId: string
}

const COACHING_STYLES: {
  key: CoachingStyle; label: string; tagline: string; desc: string; icon: string
  accent: string; activeBg: string; activeIconBg: string
}[] = [
  {
    key: 'advisor',
    label: 'Advisor',
    tagline: 'Balanced analysis, no verdict',
    desc: "Lays out evidence and surfaces what you haven't considered. Doesn't tell you what to do — shows you what you're not seeing.",
    icon: 'ph-scales',
    accent: '#4E3D63',
    activeBg: 'rgba(78,61,99,0.07)',
    activeIconBg: 'rgba(78,61,99,0.14)',
  },
  {
    key: 'supporter',
    label: 'Supporter',
    tagline: 'Builds your confidence',
    desc: 'Validates your instincts and finds the logic in your direction. Still flags genuine gaps, but frames them as things you can handle.',
    icon: 'ph-hand-fist',
    accent: '#1A7A3A',
    activeBg: 'rgba(26,122,58,0.07)',
    activeIconBg: 'rgba(26,122,58,0.14)',
  },
  {
    key: 'critic',
    label: 'Critic',
    tagline: 'Arguments until it holds',
    desc: "Steelmans the opposite of whatever you're leaning toward. Doesn't stop until your reasoning survives a real challenge.",
    icon: 'ph-sword',
    accent: '#C0392B',
    activeBg: 'rgba(192,57,43,0.07)',
    activeIconBg: 'rgba(192,57,43,0.14)',
  },
]

type Phase = 'intro' | 'style' | 'chat' | 'saving' | 'result'

interface Recommendation {
  id: string
  answer: string
  rationale: string
  evidence: { pattern: string; finding: string }[]
}

interface Props {
  onComplete: (decisionId?: string) => void
}

function pushToStyle(push: number): CoachingStyle {
  if (push >= 4) return 'critic'
  if (push <= 2) return 'supporter'
  return 'advisor'
}

export function RealInterrogation({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [title, setTitle] = useState('')
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>('advisor')
  const [suggestedStyle, setSuggestedStyle] = useState<CoachingStyle | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Pre-select the coaching style that matches the user's profile push preference
  useEffect(() => {
    fetch('/api/user')
      .then(r => r.ok ? r.json() : null)
      .then((user) => {
        const push = user?.profileAnswers?.push
        if (typeof push === 'number') {
          const style = pushToStyle(push)
          setSuggestedStyle(style)
          setCoachingStyle(style)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/interrogation',
    body: {
      decisionTitle: title,
      coachingStyle,
      decisionId: sessionData?.decisionId,
      sessionId: sessionData?.sessionId,
    },
    onFinish() {
      setTimeout(() => textareaRef.current?.focus(), 100)
    },
  })

  // Exclude the auto-sent initial message from user response counts
  const userResponses = messages.filter(m => m.role === 'user').slice(1)
  const canSave = userResponses.length >= 5 && !isLoading

  // Send the opening message once the session is ready
  useEffect(() => {
    if (phase === 'chat' && sessionData && messages.length === 0 && !isLoading) {
      append({ role: 'user', content: `I need to think through this decision: ${title}` })
    }
  }, [phase, sessionData]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startInterrogation() {
    setIsStarting(true)
    try {
      const res = await fetch('/api/interrogation/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionTitle: title, coachingStyle }),
      })
      if (!res.ok) throw new Error('Failed to start session')
      const data: SessionData = await res.json()
      setSessionData(data)
      setPhase('chat')
    } catch {
      // Stay on style phase — show nothing, user can retry
    } finally {
      setIsStarting(false)
    }
  }

  async function handleSave() {
    if (!sessionData) return
    setSaveError(false)
    setPhase('saving')
    try {
      const turns = messages.map(m => ({ role: m.role, content: m.content, id: m.id }))

      // 1. Persist turns
      const turnsRes = await fetch(`/api/interrogation/${sessionData.sessionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns }),
      })
      if (!turnsRes.ok) throw new Error('Failed to save turns')

      // 2. Generate recommendation from transcript
      const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      const summaryRes = await fetch(`/api/interrogation/${sessionData.sessionId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!summaryRes.ok) throw new Error('Failed to generate summary')

      const rec: Recommendation = await summaryRes.json()
      setRecommendation(rec)
      setPhase('result')
    } catch {
      setSaveError(true)
      setPhase('chat')
    }
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="di-root">
        <div className="di-main">
          <div className="di-main-inner" style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ph ph-intersect" style={{ fontSize: 15 }} />
              Interrogation
            </div>
            <h2 style={{ marginBottom: 10, fontSize: 28 }}>What's the decision?</h2>
            <p className="muted" style={{ marginBottom: 28, fontSize: 15 }}>
              Name it plainly — one sentence, no hedging.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Should I accept the Figma offer or finish my thesis first?"
                autoFocus
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--input)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--card)',
                  fontSize: 15,
                  color: 'var(--fg)',
                  outline: 'none',
                  width: '100%',
                }}
                onKeyDown={e => e.key === 'Enter' && title.trim() && setPhase('style')}
              />
              <button
                className="btn-lime"
                disabled={!title.trim()}
                onClick={() => setPhase('style')}
                style={{ alignSelf: 'flex-start' }}
              >
                Next
                <i className="ph-bold ph-arrow-right" style={{ fontSize: 15 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Style ──────────────────────────────────────────────────────────────────
  if (phase === 'style') {
    return (
      <div className="di-root">
        <div className="di-main">
          <div className="di-main-inner" style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ph ph-intersect" style={{ fontSize: 15 }} />
              Interrogation
            </div>
            <h2 style={{ marginBottom: 8, fontSize: 24 }}>{title}</h2>
            <p className="muted" style={{ marginBottom: 28 }}>Choose how Blindspot shows up.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {COACHING_STYLES.map(s => {
                const on = coachingStyle === s.key
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setCoachingStyle(s.key)}
                    style={{
                      textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '15px 16px',
                      border: `1.5px solid ${on ? s.accent : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      background: on ? s.activeBg : 'var(--card)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: on ? s.activeIconBg : 'var(--muted)',
                      color: on ? s.accent : 'var(--fg-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ph ${s.icon}`} style={{ fontSize: 20 }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: on ? s.accent : 'var(--fg)' }}>{s.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.tagline}</span>
                        {suggestedStyle === s.key && (
                          <span style={{
                            fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
                            background: 'var(--lime, #b8d14a)', color: '#000',
                            borderRadius: 4, padding: '2px 6px', fontWeight: 700, lineHeight: 1,
                          }}>
                            Suggested
                          </span>
                        )}
                      </span>
                      <span style={{ display: 'block', fontSize: 13, lineHeight: '19px', color: 'var(--fg-muted)' }}>{s.desc}</span>
                    </span>
                    <span style={{
                      flexShrink: 0, width: 22, height: 22, borderRadius: 9999,
                      border: on ? 'none' : '1.5px solid var(--border)',
                      background: on ? s.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                    }}>
                      {on && <i className="ph-bold ph-check" style={{ fontSize: 12, color: '#fff' }} />}
                    </span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                className="btn-lime"
                onClick={startInterrogation}
                disabled={isStarting}
              >
                {isStarting ? 'Starting…' : 'Begin interrogation'}
                {!isStarting && <i className="ph-bold ph-arrow-right" style={{ fontSize: 15 }} />}
              </button>
              <button
                onClick={() => setPhase('intro')}
                style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: 14, padding: '0 8px' }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Saving ─────────────────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="di-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg-muted)' }}>
          <i className="ph ph-circle-notch" style={{ fontSize: 32, display: 'block', marginBottom: 12 }} />
          Generating recommendation…
        </div>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result' && recommendation) {
    return (
      <div className="di-root">
        <div className="di-main">
          <div className="di-main-inner" style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ph ph-intersect" style={{ fontSize: 15 }} />
              Blindspot
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(18px, 2.2vw, 26px)',
              lineHeight: 1.3,
              color: 'var(--fg)',
              marginBottom: 20,
            }}>
              {recommendation.answer}
            </div>
            <p style={{ fontSize: 15, lineHeight: '24px', color: 'var(--fg-muted)', marginBottom: 24 }}>
              {recommendation.rationale}
            </p>
            {recommendation.evidence.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {recommendation.evidence.map(e => (
                  <div key={e.pattern} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--muted)', borderLeft: '3px solid var(--border)' }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 4 }}>
                      {e.pattern}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: '20px', color: 'var(--fg)' }}>
                      {e.finding}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-lime" onClick={() => onComplete(sessionData?.decisionId)}>
              <i className="ph-bold ph-check" style={{ fontSize: 15 }} />
              View in log
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className="di-root">
      {/* Left panel — question + answer */}
      <div className="di-main">
        <div className="di-main-inner">
          <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ph ph-intersect" style={{ fontSize: 15 }} />
            {title}
          </div>

          {/* Current AI question */}
          {lastAssistant ? (
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(20px, 2.5vw, 32px)',
              lineHeight: 1.25,
              color: 'var(--fg)',
              marginBottom: 32,
              letterSpacing: '-0.01em',
              animation: 'di-enter 260ms var(--ease-out)',
            }}>
              {lastAssistant.content}
            </div>
          ) : (
            <div style={{ height: 40, display: 'flex', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ color: 'var(--fg-muted)', fontSize: 15 }}>Thinking…</span>
            </div>
          )}

          {/* Answer textarea + send */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              ref={textareaRef}
              rows={5}
              value={input}
              onChange={handleInputChange}
              placeholder="Your answer…"
              disabled={isLoading}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--input)',
                background: 'var(--card)',
                fontSize: 15,
                lineHeight: '24px',
                resize: 'none',
                outline: 'none',
                color: 'var(--fg)',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                type="submit"
                className="btn-lime"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? 'Thinking…' : 'Send'}
                {!isLoading && <i className="ph-bold ph-arrow-right" style={{ fontSize: 15 }} />}
              </button>
              {canSave && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleSave}
                  style={{ fontSize: 14 }}
                >
                  <i className="ph ph-floppy-disk" style={{ fontSize: 15 }} />
                  Save to log
                </button>
              )}
              {saveError && (
                <span style={{ fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ph ph-warning" />
                  Save failed —{' '}
                  <button
                    type="button"
                    onClick={handleSave}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13, padding: 0 }}
                  >
                    try again
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Right panel — reasoning ledger */}
      <div className="di-sidebar">
        <div className="di-sidebar-inner">
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
            Reasoning ledger
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {userResponses.map((msg, i) => (
              <div key={msg.id} style={{ borderLeft: '2px solid rgba(184,209,74,0.4)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                  Response {i + 1}
                </div>
                <div style={{ fontSize: 13, lineHeight: '20px', color: 'rgba(255,255,255,0.75)' }}>
                  {msg.content.slice(0, 200)}{msg.content.length > 200 ? '…' : ''}
                </div>
              </div>
            ))}

            {userResponses.length === 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                Your answers will appear here as you respond.
              </div>
            )}
          </div>

          {userResponses.length >= 3 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                Progress
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {userResponses.length} responses · {canSave ? 'Ready to save' : `${Math.max(0, 5 - userResponses.length)} more to go`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
