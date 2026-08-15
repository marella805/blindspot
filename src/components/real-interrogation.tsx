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

type Phase = 'intro' | 'context' | 'style' | 'chat' | 'saving' | 'result'

const CATEGORY_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'career', label: 'Career', icon: 'ph-briefcase' },
  { id: 'financial', label: 'Financial', icon: 'ph-coins' },
  { id: 'relationship', label: 'Relationship', icon: 'ph-heart' },
  { id: 'health', label: 'Health', icon: 'ph-heartbeat' },
  { id: 'education', label: 'Education', icon: 'ph-graduation-cap' },
  { id: 'housing', label: 'Housing', icon: 'ph-house' },
  { id: 'business', label: 'Business', icon: 'ph-buildings' },
  { id: 'personal_growth', label: 'Growth', icon: 'ph-plant' },
  { id: 'other', label: 'Other', icon: 'ph-dots-three' },
]

interface Recommendation {
  id: string
  answer: string
  rationale: string
  evidence: { pattern: string; finding: string }[]
}

interface Props {
  onComplete: (decisionId?: string) => void
  demo?: boolean
}

const DEMO_DATA = {
  title: 'Should I take the senior PM role at this startup?',
  summary: "I've been offered a senior PM role at a 50-person Series B startup. It pays 15% less than my current job but has meaningful equity.",
  category: 'career',
  options: ['Take the startup role', 'Stay in my current role'],
  coachingStyle: 'advisor' as CoachingStyle,
  responses: [
    "I'm optimizing for learning speed and career trajectory. The equity could be meaningful if they exit, but I know that's a long shot.",
    "The biggest risk is that the startup fails — statistically likely. But I've been at my current company four years and feel completely stagnant.",
    "If I'm honest, I'd take the startup role even knowing the risk. I can recover from failure but I can't recover from not trying.",
    "What I'd need to be wrong about is the equity being worthless and the experience not translating back to a stable role. Both feel recoverable.",
    "I'm optimizing for the person I'll be in five years, not the salary I have today.",
  ],
}

function pushToStyle(push: number): CoachingStyle {
  if (push >= 4) return 'critic'
  if (push <= 2) return 'supporter'
  return 'advisor'
}

export function RealInterrogation({ onComplete, demo = false }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [title, setTitle] = useState(demo ? DEMO_DATA.title : '')
  const [summary, setSummary] = useState(demo ? DEMO_DATA.summary : '')
  const [category, setCategory] = useState(demo ? DEMO_DATA.category : 'other')
  const [options, setOptions] = useState(demo ? DEMO_DATA.options : ['', ''])
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>(demo ? DEMO_DATA.coachingStyle : 'advisor')
  const demoResponseIdx = useRef(0)
  const [suggestedStyle, setSuggestedStyle] = useState<CoachingStyle | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [startError, setStartError] = useState(false)
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

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  // Check support client-side only
  const [hasSpeech, setHasSpeech] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHasSpeech(typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
  }, [])

  const { messages, input, setInput, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/interrogation',
    body: {
      decisionTitle: title,
      decisionSummary: summary,
      decisionOptions: options.filter(o => o.trim()),
      coachingStyle,
      decisionId: sessionData?.decisionId,
      sessionId: sessionData?.sessionId,
    },
    onFinish() {
      setTimeout(() => textareaRef.current?.focus(), 100)
    },
  })

  // Demo mode: Cmd+Enter advances through setup phases then sends scripted responses
  useEffect(() => {
    if (!demo) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return
      e.preventDefault()
      if (phase === 'intro')   { setPhase('context'); return }
      if (phase === 'context') { setPhase('style');   return }
      if (phase === 'style')   { startInterrogation(); return }
      if (phase === 'chat' && !isLoading) {
        const next = DEMO_DATA.responses[demoResponseIdx.current]
        if (next) { demoResponseIdx.current++; setInput(next) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, phase, isLoading])

  function toggleSpeech() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  // Exclude the auto-sent initial message from user response counts
  const userResponses = messages.filter(m => m.role === 'user').slice(1)
  const canSave = userResponses.length >= 3 && !isLoading

  // Auto-wrap after 6 responses — pull the result screen without needing a manual click
  useEffect(() => {
    if (phase === 'chat' && userResponses.length >= 6 && !isLoading && sessionData) {
      handleSave()
    }
  }, [userResponses.length, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Send the opening message once the session is ready
  useEffect(() => {
    if (phase === 'chat' && sessionData && messages.length === 0 && !isLoading) {
      const filledOptions = options.filter(o => o.trim())
      const optionText = filledOptions.length > 0
        ? ` My options are: ${filledOptions.join(', ')}.`
        : ''
      const summaryText = summary.trim() ? ` Context: ${summary.trim()}.` : ''
      append({ role: 'user', content: `I need to think through this decision: ${title}.${summaryText}${optionText}` })
    }
  }, [phase, sessionData]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startInterrogation() {
    setIsStarting(true)
    setStartError(false)
    try {
      const res = await fetch('/api/interrogation/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionTitle: title,
          coachingStyle,
          summary: summary.trim() || undefined,
          category,
          options: options.filter(o => o.trim()),
        }),
      })
      if (!res.ok) throw new Error('Failed to start session')
      const data: SessionData = await res.json()
      setSessionData(data)
      setPhase('chat')
    } catch {
      setStartError(true)
    } finally {
      setIsStarting(false)
    }
  }

  async function handleSave() {
    if (!sessionData) return
    // Stop any active recording before saving
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false) }
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
              {demo && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--blue-ink-50)', border: '1px solid var(--blue-ink-100)', borderRadius: 6, padding: '2px 8px' }}>
                  <i className="ph-fill ph-play-circle" />
                  Demo · ⌘↵ to advance
                </span>
              )}
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
                onKeyDown={e => e.key === 'Enter' && title.trim() && setPhase('context')}
              />
              <button
                className="btn-lime"
                disabled={!title.trim()}
                onClick={() => setPhase('context')}
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

  // ── Context ────────────────────────────────────────────────────────────────
  if (phase === 'context') {
    const filledOptions = options.filter(o => o.trim()).length

    function setOption(i: number, val: string) {
      setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
    }

    function addOption() {
      if (options.length < 6) setOptions(prev => [...prev, ''])
    }

    function removeOption(i: number) {
      if (options.length <= 2) return
      setOptions(prev => prev.filter((_, idx) => idx !== i))
    }

    return (
      <div className="di-root">
        <div className="di-main">
          <div className="di-main-inner" style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ph ph-intersect" style={{ fontSize: 15 }} />
              Interrogation
            </div>
            <h2 style={{ marginBottom: 4, fontSize: 24 }}>{title}</h2>
            <p className="muted" style={{ marginBottom: 28, fontSize: 14 }}>
              Add context so the interrogation is more targeted. All fields are optional.
            </p>

            {/* Summary */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 8, fontWeight: 600 }}>
                What makes this hard?
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Context, constraints, what's at stake — anything that makes this decision genuinely difficult."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--input)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--card)',
                  fontSize: 14,
                  lineHeight: '22px',
                  resize: 'none',
                  outline: 'none',
                  color: 'var(--fg)',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 10, fontWeight: 600 }}>
                Category
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORY_OPTIONS.map(cat => {
                  const on = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 9999,
                        border: `1.5px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                        background: on ? 'rgba(59,110,221,0.08)' : 'var(--card)',
                        color: on ? 'var(--primary)' : 'var(--fg-muted)',
                        fontSize: 13,
                        fontWeight: on ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 120ms',
                      }}
                    >
                      <i className={`ph ${cat.icon}`} style={{ fontSize: 14 }} />
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Options */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 10, fontWeight: 600 }}>
                Options you're choosing between
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 20, textAlign: 'right', flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => setOption(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        border: '1px solid var(--input)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--card)',
                        fontSize: 14,
                        color: 'var(--fg)',
                        outline: 'none',
                      }}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '4px', lineHeight: 1, flexShrink: 0 }}
                        aria-label="Remove option"
                      >
                        <i className="ph ph-x" style={{ fontSize: 14 }} />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '7px 14px',
                      color: 'var(--fg-muted)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginLeft: 28,
                    }}
                  >
                    <i className="ph ph-plus" style={{ fontSize: 13 }} />
                    Add option
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                className="btn-lime"
                onClick={() => setPhase('style')}
              >
                {filledOptions >= 2 || summary.trim() ? 'Next' : 'Skip for now'}
                <i className="ph-bold ph-arrow-right" style={{ fontSize: 15 }} />
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

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-lime"
                onClick={startInterrogation}
                disabled={isStarting}
              >
                {isStarting ? 'Starting…' : 'Begin interrogation'}
                {!isStarting && <i className="ph-bold ph-arrow-right" style={{ fontSize: 15 }} />}
              </button>
              <button
                onClick={() => setPhase('context')}
                style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: 14, padding: '0 8px' }}
              >
                Back
              </button>
              {startError && (
                <span style={{ fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ph ph-warning" />
                  Something went wrong — try again
                </span>
              )}
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
      <div className="di-main">
        <div className="di-main-inner" style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ph ph-intersect" style={{ fontSize: 15 }} />
            {title}
            {demo && (
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--blue-ink-50)', border: '1px solid var(--blue-ink-100)', borderRadius: 6, padding: '2px 8px' }}>
                <i className="ph-fill ph-play-circle" />
                Demo · ⌘↵ to advance
              </span>
            )}
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
          <form onSubmit={e => { if (isListening) { recognitionRef.current?.stop(); setIsListening(false) } handleSubmit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              ref={textareaRef}
              rows={5}
              value={input}
              onChange={handleInputChange}
              placeholder={isListening ? 'Listening… speak your answer' : 'Your answer…'}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isListening ? 'var(--primary)' : 'var(--input)'}`,
                background: isListening ? 'rgba(59,110,221,0.04)' : 'var(--card)',
                fontSize: 15,
                lineHeight: '24px',
                resize: 'none',
                outline: 'none',
                color: 'var(--fg)',
                opacity: isLoading ? 0.6 : 1,
                transition: 'border-color 150ms, background 150ms',
              }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {hasSpeech && (
                <button
                  type="button"
                  onClick={toggleSpeech}
                  disabled={isLoading}
                  title={isListening ? 'Stop recording' : 'Speak your answer'}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: isListening ? 'none' : '1px solid var(--border)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                    background: isListening ? 'var(--primary)' : 'var(--card)',
                    color: isListening ? '#fff' : 'var(--fg-muted)',
                    transition: 'background 150ms, color 150ms, border-color 150ms',
                    animation: isListening ? 'pulse 1.4s ease-in-out infinite' : 'none',
                    boxShadow: isListening ? '0 0 0 4px rgba(59,110,221,0.18)' : 'none',
                  }}
                >
                  <i className="ph-fill ph-microphone" />
                </button>
              )}
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
                  className="btn-lime"
                  onClick={handleSave}
                  style={{ fontSize: 14 }}
                >
                  <i className="ph ph-sparkle" style={{ fontSize: 15 }} />
                  Get my recommendation
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

    </div>
  )
}
