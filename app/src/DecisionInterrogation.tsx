import { useState, useRef, useEffect } from 'react'
import { sampleInterrogation } from './data'

interface Props {
  isFresh: boolean
  onComplete: () => void
}

const QUESTIONS = [
  {
    eyebrow: 'Objective',
    label: 'What you\'re optimizing for',
    num: '01',
    text: "Three years after you decide, what is the single outcome this choice is meant to produce? Name the outcome. Not \"the best option,\" the actual thing you want to be true.",
    sample: sampleInterrogation.responses[0],
    placeholder: "Be specific. What outcome matters most?",
  },
  {
    eyebrow: 'Network',
    label: 'Why the stated advantage matters',
    num: '02',
    text: "You said one option has an advantage. Why does that advantage actually matter to the outcome you named? Don't restate the option — argue for why this specific edge connects to what you want.",
    sample: sampleInterrogation.responses[1],
    placeholder: "Name the people pulling on this. What does each one want?",
  },
  {
    eyebrow: 'Challenge',
    label: 'Whether it survives challenge',
    num: '03',
    text: "Give me the best argument against the option you're leaning toward. Not a weak version — the one that actually gives you pause. If you can't name one, you're not thinking clearly yet.",
    sample: sampleInterrogation.responses[2],
    placeholder: "Steel-man the other side. What's the strongest case against your current lean?",
  },
  {
    eyebrow: 'Price',
    label: 'The price, named',
    num: '04',
    text: "One more angle. It's decided, and you've just told a close friend where you're going. In the version where you pick your current lean, what is the first feeling: relief, or the need to justify it? Be honest about the answer.",
    sample: sampleInterrogation.responses[3],
    placeholder: "If this goes badly, what does that actually look like in 2 years?",
  },
  {
    eyebrow: 'Revealed',
    label: 'Stated vs. revealed preference',
    num: '05',
    text: "What have you been skipping past? There's a fact, a fear, or a constraint you keep not logging. Name it now — the thing that's actually shaping this more than what you've written.",
    sample: sampleInterrogation.responses[4],
    placeholder: "The thing you know is relevant but haven't written down yet.",
  },
  {
    eyebrow: 'Position',
    label: 'The position you\'ll defend',
    num: '06',
    text: "State your decision plainly. One sentence. No hedging, no \"it depends.\" You can update the log later — but right now, what are you actually doing?",
    sample: sampleInterrogation.responses[5],
    placeholder: "Final answer. You can always update the log.",
  },
]

export function DecisionInterrogation({ isFresh, onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'chat' | 'summary'>('intro')
  const [title, setTitle] = useState(isFresh ? sampleInterrogation.title : '')
  const [answers, setAnswers] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [qIndex, setQIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [qIndex])

  function begin() {
    if (!title.trim()) return
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
      setPhase('summary')
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

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 36 }}>
            <span className="chip"><i className="ph ph-list-numbers" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />6 structured questions</span>
            <span className="chip"><i className="ph ph-warning-diamond" style={{ fontSize: 15, color: 'var(--warning)' }} />Real pushback</span>
            <span className="chip"><i className="ph ph-user-focus" style={{ fontSize: 15, color: 'var(--blue-ink-600)' }} />Calibrated to your profile</span>
          </div>

          <div className="field" style={{ marginBottom: 10 }}>
            <label>What are you deciding?</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && begin()}
              placeholder="e.g. Accept the Berkeley offer vs wait for NYU"
              autoFocus
              style={{ fontSize: 16 }}
            />
          </div>

          {isFresh && (
            <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>
              <i className="ph ph-sparkle" style={{ fontSize: 13, marginRight: 5, color: 'var(--blue-ink-600)' }} />
              Sample decision pre-filled for the demo. You can edit it or use your own.
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
            <button className="btn-lime" onClick={begin} disabled={!title.trim()}>
              Interrogate it<i className="ph-bold ph-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    return (
      <div className="content">
        <div className="content-inner animate-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--success)' }}>
            <i className="ph-fill ph-check-circle" style={{ fontSize: 18 }} />
            <span style={{ fontSize: 13, letterSpacing: '0.03em' }}>Reasoning is defensible</span>
          </div>
          <h2 style={{ marginBottom: 12 }}>Decision summary</h2>
          <div className="divider-line" />
          <p className="muted" style={{ marginBottom: 28 }}>A record of what you articulated. Return to it when the outcome plays out.</p>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-section">
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Decision</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1.35 }}>{title}</div>
            </div>
            <div className="card-section">
              <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>What you argued</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                {answers.map((ans, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1,
                      color: 'var(--blue-ink-200)', flexShrink: 0, marginTop: -4,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--fg-muted)', marginBottom: 3 }}>
                        {QUESTIONS[i]?.eyebrow}
                      </div>
                      <span style={{ fontSize: 15, lineHeight: '24px', color: 'var(--fg)' }}>{ans}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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
              e.target.style.boxShadow = '0 0 0 3px rgba(78,61,99,0.12)'
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
