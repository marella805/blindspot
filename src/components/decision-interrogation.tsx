'use client'

import { useState, useRef, useEffect } from 'react'
import { sampleInterrogation, seasonedSampleInterrogation } from '@/lib/demo-data'
import type { PatternAlert, DecisionEntry } from '@/types'

type CoachingStyle = 'advisor' | 'supporter' | 'critic'

const COACHING_STYLES: {
  key: CoachingStyle; label: string; tagline: string; desc: string; icon: string
  accent: string; activeBg: string; activeIconBg: string
}[] = [
  {
    key: 'advisor',
    label: 'Advisor',
    tagline: 'Balanced analysis, no verdict',
    desc: 'Lays out evidence and surfaces what you haven\'t considered. Doesn\'t tell you what to do — shows you what you\'re not seeing.',
    icon: 'ph-scales',
    accent: '#3b6edd',
    activeBg: 'rgba(59,110,221,0.07)',
    activeIconBg: 'rgba(59,110,221,0.14)',
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
    desc: 'Steelmans the opposite of whatever you\'re leaning toward. Doesn\'t stop until your reasoning survives a real challenge.',
    icon: 'ph-sword',
    accent: '#C0392B',
    activeBg: 'rgba(192,57,43,0.07)',
    activeIconBg: 'rgba(192,57,43,0.14)',
  },
]

type BlindspotRec = {
  answer: string
  rationale: string
  evidence: { pattern: string; finding: string }[]
}

function buildBlindspotRec(
  patterns: PatternAlert[],
  decisions: DecisionEntry[],
): BlindspotRec | null {
  const active = patterns.filter(p => !p.dismissed)
  if (active.length === 0) return null

  const binary   = active.find(p => p.id === 'p2')
  const career   = active.find(p => p.id === 'p1')
  const external = active.find(p => p.id === 'p3')
  const n = decisions.length

  if (binary && external && career) {
    return {
      answer: 'Negotiate with Figma before you choose.',
      rationale: 'Your log predicts you\'ll frame this as internship-or-thesis and pick the career signal. That\'s the wrong frame. The third option — deferred start or part-time — goes unasked in decisions like this. Ask first.',
      evidence: [
        {
          pattern: `Binary framing · ${binary.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'You haven\'t asked Figma about a deferred or part-time arrangement. That\'s the middle path your pattern predicts you\'ll skip.',
        },
        {
          pattern: `External validation · ${external.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'Figma\'s brand is doing work here. You pick the option that reads best to your professional network, then write the alignment story afterward.',
        },
        {
          pattern: `Career over alignment · ${career.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'If Figma says no to hybrid: stay on the thesis. The window with your advisor closes next year. The brand signal doesn\'t.',
        },
      ],
    }
  }

  if (binary && external) {
    return {
      answer: 'There\'s a third option. Find it before you choose.',
      rationale: `${binary.relatedDecisionIds.length} of ${n} decisions collapsed into A-vs-B when a middle path existed. Your log also shows you anchor to the option your network would validate. Name the hybrid before you pick.`,
      evidence: [
        {
          pattern: `Binary framing · ${binary.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'Negotiate, defer, go part-time — these paths consistently go unlogged. Name one first.',
        },
        {
          pattern: `External validation · ${external.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'Your initial lean is probably the one that reads better. Check whether that\'s doing the work here.',
        },
      ],
    }
  }

  if (binary) {
    return {
      answer: 'Name the option that isn\'t on your list yet.',
      rationale: `${binary.relatedDecisionIds.length} of ${n} decisions were framed A-vs-B when a middle path existed and went unexamined. Before you interrogate this one, name it.`,
      evidence: [
        {
          pattern: `Binary framing · ${binary.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'Negotiate, defer, hybrid — these go unlogged. Name one.',
        },
      ],
    }
  }

  if (career && external) {
    return {
      answer: 'You\'re about to pick the better-looking option again.',
      rationale: `Your last ${career.relatedDecisionIds.length} high-stakes decisions went to the stronger career signal. That may be right — but your log shows you decide for the external audience first, then write the reasoning afterward.`,
      evidence: [
        {
          pattern: `Career over alignment · ${career.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'Name what alignment costs you before you commit.',
        },
        {
          pattern: `External validation · ${external.relatedDecisionIds.length} of ${n} decisions`,
          finding: 'Write down what you\'d choose if no one in your professional network would ever know. Then compare.',
        },
      ],
    }
  }

  return null
}

interface Props {
  isFresh: boolean
  patterns?: PatternAlert[]
  decisions?: DecisionEntry[]
  onComplete: () => void
}

function buildQuestions(responses: string[]) {
  return [
    {
      eyebrow: 'Objective',
      label: 'What you\'re optimizing for',
      num: '01',
      text: "Three years after you decide, what is the single outcome this choice is meant to produce? Name the outcome. Not \"the best option,\" the actual thing you want to be true.",
      sample: responses[0],
      placeholder: "Be specific. What outcome matters most?",
    },
    {
      eyebrow: 'Network',
      label: 'Why the stated advantage matters',
      num: '02',
      text: "You said one option has an advantage. Why does that advantage actually matter to the outcome you named? Don't restate the option — argue for why this specific edge connects to what you want.",
      sample: responses[1],
      placeholder: "Name the people pulling on this. What does each one want?",
    },
    {
      eyebrow: 'Challenge',
      label: 'Whether it survives challenge',
      num: '03',
      text: "Give me the best argument against the option you're leaning toward. Not a weak version — the one that actually gives you pause. If you can't name one, you're not thinking clearly yet.",
      sample: responses[2],
      placeholder: "Steel-man the other side. What's the strongest case against your current lean?",
    },
    {
      eyebrow: 'Price',
      label: 'The price, named',
      num: '04',
      text: "One more angle. It's decided, and you've just told a close friend where you're going. In the version where you pick your current lean, what is the first feeling: relief, or the need to justify it? Be honest about the answer.",
      sample: responses[3],
      placeholder: "If this goes badly, what does that actually look like in 2 years?",
    },
    {
      eyebrow: 'Revealed',
      label: 'Stated vs. revealed preference',
      num: '05',
      text: "What have you been skipping past? There's a fact, a fear, or a constraint you keep not logging. Name it now — the thing that's actually shaping this more than what you've written.",
      sample: responses[4],
      placeholder: "The thing you know is relevant but haven't written down yet.",
    },
  ]
}

export function DecisionInterrogation({ isFresh, patterns = [], decisions = [], onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'recommendation' | 'style' | 'chat' | 'result'>('intro')
  const sample = isFresh ? sampleInterrogation : seasonedSampleInterrogation
  const QUESTIONS = buildQuestions(sample.responses)
  const [title, setTitle] = useState(sample.title)
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>('advisor')
  const [answers, setAnswers] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [qIndex, setQIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activePatterns = patterns.filter(p => !p.dismissed)
  const binaryPattern = activePatterns.find(p => p.id === 'p2')
  const externalPattern = activePatterns.find(p => p.id === 'p3')
  const preWarning = binaryPattern
    ? {
        icon: 'ph-fork-knife',
        label: 'Pattern watch',
        headline: binaryPattern.title,
        body: `In ${binaryPattern.relatedDecisionIds.length} of your logged decisions, a middle option went unexamined. Before you name options below — is there a third path you're about to skip?`,
      }
    : externalPattern
    ? {
        icon: 'ph-eye',
        label: 'Pattern watch',
        headline: externalPattern.title,
        body: `Your log shows you often anchor to the option your professional network would validate. Try naming your preferred option without that audience in your head first.`,
      }
    : null

  useEffect(() => {
    textareaRef.current?.focus()
  }, [qIndex])

  const blindspotRec = buildBlindspotRec(patterns, decisions)

  function begin() {
    if (!title.trim()) return
    setPhase('style')
  }

  function handleBegin() {
    if (blindspotRec) setPhase('recommendation')
    else startChat()
  }

  function startChat() {
    setPhase('chat')
    setQIndex(0)
    setAnswers([])
    setInput('')
  }

  function send() {
    if (!input.trim()) return
    const nextAnswers = [...answers, input.trim()]
    setAnswers(nextAnswers)
    setInput('')
    if (nextAnswers.length >= QUESTIONS.length) {
      setPhase('result')
    } else {
      setQIndex(nextAnswers.length)
    }
  }

  function insertSample() {
    setInput(QUESTIONS[qIndex].sample)
    textareaRef.current?.focus()
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="content">
        <div className="content-inner animate-enter">
          <div style={{ fontSize: 13, color: 'var(--blue-ink-600)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ph-fill ph-circle" style={{ fontSize: 8 }} />
            New interrogation
          </div>
          <h1 style={{ marginBottom: 16 }}>Before you decide,<br />defend it.</h1>
          <div className="divider-line" />
          <p className="lead" style={{ marginBottom: 28 }}>
            This is not a pros and cons list. You will be asked to justify your reasoning, and it will be pushed on wherever it is weak. The session ends when your position holds — not when you have typed enough.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 32 }}>
            <span className="chip"><i className="ph ph-list-numbers" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />5 structured questions</span>
            <span className="chip"><i className="ph ph-warning-diamond" style={{ fontSize: 15, color: 'var(--warning)' }} />Real pushback</span>
            <span className="chip"><i className="ph ph-user-focus" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />Calibrated to your profile</span>
          </div>

          {/* Pre-interrogation Blindspot recommendation (seasoned users with active patterns) */}
          {preWarning && (
            <div style={{
              border: '1px solid rgba(59,110,221,0.25)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(59,110,221,0.05)',
              padding: '16px 18px',
              marginBottom: 28,
              display: 'flex',
              gap: 13,
              alignItems: 'flex-start',
            }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--blue-ink-500)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ph-fill ph-sparkle" style={{ fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--blue-ink-600)', marginBottom: 5 }}>
                  {preWarning.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg)', marginBottom: 5 }}>
                  {preWarning.headline}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: '21px', color: 'var(--fg-muted)' }}>
                  {preWarning.body}
                </div>
              </div>
            </div>
          )}

          <div className="field" style={{ marginBottom: 10 }}>
            <label>What are you deciding?</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && begin()}
              placeholder="e.g. Accept the Figma internship vs. stay on thesis"
              autoFocus
              style={{ fontSize: 16 }}
            />
          </div>

          <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>
            <i className="ph ph-sparkle" style={{ fontSize: 13, marginRight: 5, color: 'var(--blue-ink-600)' }} />
            Sample decision pre-filled for the demo. Edit it or use your own.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
            <button className="btn-lime" onClick={begin} disabled={!title.trim()}>
              Next<i className="ph-bold ph-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Blindspot recommendation ──────────────────────────────────────────────
  if (phase === 'recommendation' && blindspotRec) {
    return (
      <div className="content">
        <div className="content-inner animate-enter">

          <div style={{ fontSize: 13, color: 'var(--blue-ink-600)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ph-fill ph-circle" style={{ fontSize: 8 }} />
            {title}
          </div>

          {/* Dark recommendation card */}
          <div style={{
            background: 'linear-gradient(165deg, #1e1c18 0%, #141210 60%, #0e0c0a 100%)',
            borderRadius: 14,
            padding: '26px 28px',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <i className="ph-fill ph-eye-slash" style={{
              position: 'absolute', right: -20, bottom: -30,
              fontSize: 160, color: 'rgba(245,217,138,0.06)',
              lineHeight: 1, pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 22, padding: '0 10px', borderRadius: 9999,
                  background: 'rgba(245,217,138,0.15)', border: '1px solid rgba(245,217,138,0.3)',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: '#F5D98A',
                }}>
                  <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
                  Blindspot recommendation
                </span>
              </div>

              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#f5f0e8', marginBottom: 14 }}>
                {blindspotRec.answer}
              </div>

              <p style={{ fontSize: 14, lineHeight: '22px', color: '#CBBFD6', marginBottom: 20 }}>
                {blindspotRec.rationale}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {blindspotRec.evidence.map((e, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#F5D98A', marginBottom: 5 }}>
                      {e.pattern}
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: '20px', color: '#CBBFD6' }}>
                      {e.finding}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Accept or interrogate */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <button
              className="btn-lime"
              onClick={onComplete}
              style={{ fontSize: 15, justifyContent: 'center' }}
            >
              <i className="ph-bold ph-check" style={{ fontSize: 15 }} />
              Accept recommendation
            </button>
            <button
              onClick={startChat}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 48, borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)', background: 'var(--card)',
                fontSize: 15, color: 'var(--fg)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Interrogate anyway
              <i className="ph-bold ph-arrow-right" style={{ fontSize: 14 }} />
            </button>
          </div>

        </div>
      </div>
    )
  }

  // ── Style picker ──────────────────────────────────────────────────────────
  if (phase === 'style') {
    return (
      <div className="content">
        <div className="content-inner animate-enter">
          <div style={{ fontSize: 13, color: 'var(--blue-ink-600)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ph-fill ph-circle" style={{ fontSize: 8 }} />
            {title}
          </div>
          <h2 style={{ marginBottom: 8 }}>How should Blindspot show up?</h2>
          <p className="muted" style={{ marginBottom: 28 }}>
            This affects how questions are framed and how hard the pushback lands. You can change it next time.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 32 }}>
            {COACHING_STYLES.map(s => {
              const on = coachingStyle === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setCoachingStyle(s.key)}
                  style={{
                    textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px',
                    border: `1.5px solid ${on ? s.accent : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    background: on ? s.activeBg : 'var(--card)',
                    cursor: 'pointer', transition: 'border-color 150ms, background 150ms',
                  }}
                >
                  <span style={{
                    flexShrink: 0, width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: on ? s.activeIconBg : 'var(--muted)',
                    color: on ? s.accent : 'var(--fg-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 150ms, color 150ms',
                  }}>
                    <i className={`ph ${s.icon}`} style={{ fontSize: 22 }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 17, fontWeight: 600, color: on ? s.accent : 'var(--fg)' }}>{s.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{s.tagline}</span>
                    </span>
                    <span style={{ display: 'block', fontSize: 14, lineHeight: '21px', color: 'var(--fg-muted)' }}>{s.desc}</span>
                  </span>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 9999, marginTop: 2,
                    border: on ? 'none' : '1.5px solid var(--border)',
                    background: on ? s.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <i className="ph-bold ph-check" style={{ fontSize: 12, color: '#fff' }} />}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn-lime" onClick={handleBegin}>
              Begin<i className="ph-bold ph-arrow-right" />
            </button>
            <button
              className="btn-ghost"
              onClick={() => setPhase('intro')}
              style={{ fontSize: 14 }}
            >
              <i className="ph ph-arrow-left" style={{ fontSize: 14 }} />
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const goalAnswer      = answers[0] ?? ''
    const revealedAnswer  = answers[4] ?? ''
    // Synthesise a call from Q5 when no pattern rec exists
    function synthesizeCall(): { answer: string; rationale: string } {
      // Look for "it's actually a X question" reframe
      const conceptMatch = revealedAnswer.match(/it'?s actually (?:a|an) ([a-zA-Z\s]+?) question/i)
      const concept = conceptMatch?.[1]?.trim()

      // Look for a named option mentioned positively (before "has", "is", "offers", "gives")
      // No /i flag — need case-sensitive to detect proper nouns
      const optionMatch = revealedAnswer.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b(?=\s+(?:has|is the|offers|gives|provides|wins|beats))/)
      const winningOption = optionMatch?.[1]?.trim()

      if (winningOption && concept) {
        return {
          answer: `${winningOption} — but argue the ${concept}, not the brand.`,
          rationale: `You reframed your own question in the last answer. Stop comparing them on prestige or cost. Compare them on ${concept}. That's the question that actually determines where you end up in three years.`,
        }
      }
      if (concept) {
        return {
          answer: `This is a ${concept} decision, not what you've been comparing.`,
          rationale: `You named the real question in answer 5. Work from that frame.`,
        }
      }
      // Fallback: first sentence of Q5
      const first = revealedAnswer.split(/[.!?]\s+/)[0]?.trim() ?? ''
      return {
        answer: first.length > 15 ? first : 'Act on what you wrote in answer 5.',
        rationale: revealedAnswer.slice(0, 200),
      }
    }

    const synth = blindspotRec
      ? { answer: blindspotRec.answer, rationale: blindspotRec.rationale }
      : synthesizeCall()

    const callText     = synth.answer
    const rationaleText = synth.rationale

    return (
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="content-inner animate-enter">

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--success)' }}>
            <i className="ph-fill ph-check-circle" style={{ fontSize: 16 }} />
            <span style={{ fontSize: 13, letterSpacing: '0.03em' }}>Interrogation complete</span>
          </div>

          {/* Recommendation card */}
          <div style={{
            background: 'linear-gradient(165deg, #1e1c18 0%, #141210 60%, #0e0c0a 100%)',
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 22,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <i className="ph-fill ph-eye-slash" style={{
              position: 'absolute', right: -20, bottom: -30,
              fontSize: 160, color: 'rgba(245,217,138,0.06)',
              lineHeight: 1, pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 22, padding: '0 10px', borderRadius: 9999,
                  background: 'rgba(245,217,138,0.15)', border: '1px solid rgba(245,217,138,0.3)',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: '#F5D98A',
                }}>
                  <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
                  Blindspot's call
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#a09890', marginBottom: 10, fontStyle: 'italic' }}>
                Re: {title}
              </div>

              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#f5f0e8', marginBottom: 14 }}>
                {callText}
              </div>

              <p style={{ fontSize: 14, lineHeight: '22px', color: '#CBBFD6', marginBottom: 20 }}>
                {rationaleText}
              </p>

              {blindspotRec && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {blindspotRec.evidence.map((e, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '11px 14px',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#F5D98A', marginBottom: 4 }}>
                        {e.pattern}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: '19px', color: '#CBBFD6' }}>{e.finding}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* How we got here — Objective → Revealed */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--fg-muted)', marginBottom: 14 }}>
              How we got here
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>

              {/* Objective */}
              <div style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flexShrink: 0, width: 24 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 9999, background: 'var(--blue-ink-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ph-bold ph-flag" style={{ fontSize: 11, color: '#fff' }} />
                  </div>
                  <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 5 }} />
                </div>
                <div style={{ paddingTop: 2, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--blue-ink-600)', marginBottom: 4 }}>Objective</div>
                  <div style={{ fontSize: 14, lineHeight: '21px', color: 'var(--fg)' }}>
                    {goalAnswer.length > 140 ? goalAnswer.slice(0, 140) + '…' : goalAnswer}
                  </div>
                </div>
              </div>

              {/* Revealed */}
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flexShrink: 0, width: 24 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 9999, background: '#F5D98A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ph-bold ph-eye" style={{ fontSize: 11, color: '#6A4A10' }} />
                  </div>
                </div>
                <div style={{ paddingTop: 2, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#4E6B10', marginBottom: 4 }}>What you revealed</div>
                  <div style={{
                    fontSize: 14, lineHeight: '21px', color: 'var(--fg)',
                    borderLeft: '2px solid #F5D98A', paddingLeft: 12,
                  }}>
                    {revealedAnswer.length > 180 ? revealedAnswer.slice(0, 180) + '…' : revealedAnswer}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn-lime" onClick={onComplete}>
              Save to log<i className="ph-bold ph-arrow-right" />
            </button>
            <button className="btn-ghost" onClick={() => { setPhase('intro'); setAnswers([]); setQIndex(0) }}>
              Start over
            </button>
          </div>

        </div>
      </div>
    )
  }

  // ── Chat — two-panel layout ───────────────────────────────────────────────
  const currentQ = QUESTIONS[qIndex]
  const claimed = answers.length

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

      {/* Left: question + input */}
      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '48px 52px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32 }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 72,
              lineHeight: 1,
              color: 'var(--blue-ink-200)',
              flexShrink: 0,
              marginTop: -8,
            }}>
              {currentQ.num}
            </span>
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--blue-ink-600)', marginBottom: 6 }}>
                Question {qIndex + 1} of {QUESTIONS.length}
              </div>
              <div style={{ width: 36, height: 1.5, background: 'var(--blue-ink-600)', opacity: 0.4, marginBottom: 2 }} />
            </div>
          </div>

          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            lineHeight: 1.28,
            letterSpacing: '-0.01em',
            color: 'var(--fg)',
            marginBottom: 32,
          }}>
            {currentQ.text}
          </div>

          <textarea
            ref={textareaRef}
            rows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={currentQ.placeholder}
            style={{
              width: '100%', padding: '14px 16px',
              border: '1px solid var(--input)', borderRadius: 'var(--radius-lg)',
              background: 'var(--card)', fontSize: 16, lineHeight: '26px',
              resize: 'none', outline: 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--blue-ink-500)'
              e.target.style.boxShadow = '0 0 0 3px rgba(59,110,221,0.12)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--input)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '16px 52px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 120, height: 4, background: 'var(--muted)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%`, height: '100%', background: 'var(--lime)', borderRadius: 2, transition: 'width 400ms var(--ease-out)' }} />
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{qIndex + 1} / {QUESTIONS.length}</span>
              </div>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={insertSample}>
                <i className="ph ph-magic-wand" style={{ fontSize: 14 }} />
                Insert sample answer
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="muted" style={{ fontSize: 12 }}>Return to send</span>
              <button className="btn-lime" onClick={send} disabled={!input.trim()}>
                Continue<i className="ph-bold ph-arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: reasoning ledger */}
      <div style={{
        width: 320,
        flexShrink: 0,
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 24px',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--fg-muted)', marginBottom: 12 }}>
          Reasoning ledger
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--fg)', marginBottom: 8 }}>
          Toward a defensible position
        </div>
        <div style={{ fontSize: 13, lineHeight: '20px', color: 'var(--fg-muted)', marginBottom: 20 }}>
          The session closes when every load-bearing claim holds, not when you have written enough.
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--fg)' }}>{claimed}</span>
          {' / '}
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--fg)' }}>{QUESTIONS.length}</span>
          <br />
          <span style={{ fontSize: 12 }}>claims established</span>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
          {QUESTIONS.map((q, i) => {
            const done = i < claimed
            const active = i === qIndex
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 9999,
                  border: done ? 'none' : `1.5px solid ${active ? 'var(--blue-ink-500)' : 'var(--border)'}`,
                  background: done ? 'var(--success)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                  transition: 'all 200ms',
                }}>
                  {done && <i className="ph-bold ph-check" style={{ fontSize: 11, color: '#fff' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    color: done ? 'var(--fg)' : active ? 'var(--blue-ink-700)' : 'var(--fg-muted)',
                    fontWeight: active ? 500 : 400,
                    marginBottom: done && answers[i] ? 3 : 0,
                  }}>
                    {q.label}
                  </div>
                  {done && answers[i] && (
                    <div style={{
                      fontSize: 12, lineHeight: '18px', color: 'var(--fg-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}>
                      {answers[i]}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
