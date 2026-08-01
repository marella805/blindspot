import { useState } from 'react'
import type { AppData } from './types'

interface Props {
  data: AppData
  isFresh: boolean
}

type CardOption = { key: string; label: string; desc: string; icon: string }
type Question =
  | { id: string; kind: 'cards'; multi: boolean; min: number; title: string; subtitle: string; options: CardOption[] }
  | { id: string; kind: 'scale'; min: number; title: string; subtitle: string; scaleLow: string; scaleHigh: string; notes: string[] }

const QUESTIONS: Question[] = [
  {
    id: 'areas', kind: 'cards', multi: true, min: 1,
    title: 'Where do you want Blindspot in the room?',
    subtitle: 'Pick the areas where you want a second mind on your decisions. Choose as many as apply.',
    options: [
      { key: 'career',        label: 'Career & work',       desc: 'Roles, moves, negotiations, big bets at work.',              icon: 'ph-briefcase' },
      { key: 'financial',     label: 'Money & finance',     desc: "Large purchases, investments, risk you can't easily undo.",   icon: 'ph-wallet' },
      { key: 'relationships', label: 'Relationships',       desc: 'Commitments, boundaries, hard conversations.',               icon: 'ph-users' },
      { key: 'health',        label: 'Health & habits',     desc: "Care you keep deferring, routines you want to hold.",        icon: 'ph-heartbeat' },
      { key: 'family',        label: 'Family',              desc: 'Caregiving, living arrangements, shared plans.',             icon: 'ph-house-line' },
      { key: 'personal',      label: 'Personal direction',  desc: 'Identity, time, the shape of the next few years.',          icon: 'ph-compass' },
    ],
  },
  {
    id: 'struggles', kind: 'cards', multi: true, min: 1,
    title: 'Where do decisions get hard for you?',
    subtitle: "Be honest — this is what the interrogation will press on. Pick your top one or two.",
    options: [
      { key: 'overthink', label: 'I overthink and stall',   desc: 'I gather endlessly and struggle to close.',                 icon: 'ph-arrows-clockwise' },
      { key: 'others',    label: 'I wait for permission',   desc: "I want someone else to sign off before I move.",            icon: 'ph-hand-waving' },
      { key: 'binary',    label: 'I see it as all-or-nothing', desc: 'I collapse choices into two extremes.',                  icon: 'ph-scales' },
      { key: 'gut',       label: 'I decide too fast',       desc: 'I commit on instinct, then backfill reasons.',             icon: 'ph-lightning' },
      { key: 'avoid',     label: 'I avoid deciding',        desc: 'I let the deadline or default choose for me.',             icon: 'ph-clock-countdown' },
      { key: 'sunk',      label: "I can't let go",          desc: "Past effort keeps me in the wrong choice.",                icon: 'ph-anchor' },
    ],
  },
  {
    id: 'risk', kind: 'scale', min: 1,
    title: 'How much risk sits comfortably with you?',
    subtitle: 'When a choice is reversible but uncertain, where do you naturally land?',
    scaleLow: 'Protect the downside', scaleHigh: 'Chase the upside',
    notes: [
      "You anchor to the safe option. Blindspot will make sure caution isn't quietly costing you the upside.",
      "You lean careful. Blindspot will surface the cost of the safe choice alongside its comfort.",
      "You weigh both sides evenly. Blindspot will keep you from splitting the difference just to avoid choosing.",
      "You lean bold. Blindspot will make sure the downside is actually named before you commit.",
      "You chase upside. Blindspot will slow the moments where a fast yes is hard to walk back.",
    ],
  },
  {
    id: 'pace', kind: 'scale', min: 1,
    title: 'How do you like to move once it matters?',
    subtitle: "Not how fast you can — how fast you're comfortable committing.",
    scaleLow: 'Sit with it', scaleHigh: 'Decide and go',
    notes: [
      "You need to sit with things. Blindspot will give you structure so deliberation doesn't become avoidance.",
      "You prefer to marinate. Blindspot will help you tell reflection apart from stalling.",
      "You're balanced. Blindspot will match its depth to what the decision actually warrants.",
      "You like momentum. Blindspot will insert one real pause before the irreversible ones.",
      "You move fast. Blindspot will catch the fast yeses that deserve a second look.",
    ],
  },
  {
    id: 'triggers', kind: 'cards', multi: true, min: 1,
    title: 'What tips you into a call you regret?',
    subtitle: 'The conditions where your judgment slips. Blindspot watches harder when it sees these.',
    options: [
      { key: 'pressure', label: 'Time pressure',      desc: 'A deadline or an on-the-spot ask.',           icon: 'ph-timer' },
      { key: 'conflict', label: 'Avoiding conflict',  desc: 'I concede to end the tension.',               icon: 'ph-hand-palm' },
      { key: 'emotion',  label: 'Running hot',         desc: 'I decide while angry, anxious, or elated.',  icon: 'ph-wave-triangle' },
      { key: 'fomo',     label: 'Fear of missing out', desc: 'A closing window makes me leap.',           icon: 'ph-door-open' },
      { key: 'approval', label: 'Wanting to look good', desc: 'The choice that reads well wins.',         icon: 'ph-eye' },
      { key: 'fatigue',  label: 'Decision fatigue',   desc: 'Late in the day I just want it over.',       icon: 'ph-battery-low' },
    ],
  },
  {
    id: 'push', kind: 'scale', min: 1,
    title: 'How hard should Blindspot push back?',
    subtitle: 'When your reasoning is thin, how much friction do you want?',
    scaleLow: 'Gentle nudge', scaleHigh: 'Adversarial',
    notes: [
      "A light touch. Blindspot will ask, not argue — one clarifying question at a time.",
      "Mostly gentle. Blindspot will flag weak spots but leave the digging to you.",
      "Balanced. Blindspot will challenge the claim that matters most and let the rest go.",
      "Firm. Blindspot will contest circular or convenient reasoning until it holds.",
      "Adversarial. Blindspot will steelman the opposite of whatever you choose.",
    ],
  },
  {
    id: 'consult', kind: 'cards', multi: true, min: 1,
    title: "When you're stuck, where do you turn?",
    subtitle: "Knowing your defaults tells Blindspot whose voice is already in the room.",
    options: [
      { key: 'self',    label: 'I sit with it alone',     desc: 'I think it through by myself first.',           icon: 'ph-user' },
      { key: 'partner', label: 'A partner or close friend', desc: 'One trusted person I talk it out with.',      icon: 'ph-heart' },
      { key: 'network', label: 'A wide circle',           desc: 'I poll lots of people for input.',             icon: 'ph-users-three' },
      { key: 'expert',  label: 'An expert',               desc: "I want someone who's done it before.",         icon: 'ph-graduation-cap' },
      { key: 'data',    label: 'The numbers',             desc: 'I model it out and follow the data.',          icon: 'ph-chart-line' },
      { key: 'gut',     label: 'My gut',                  desc: 'I check in with how it feels.',                icon: 'ph-compass-tool' },
    ],
  },
]

type Answers = {
  areas: string[]; struggles: string[]; risk: number; pace: number
  triggers: string[]; push: number; consult: string[]
}

function emptyAnswers(): Answers {
  return { areas: [], struggles: [], risk: 0, pace: 0, triggers: [], push: 0, consult: [] }
}

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
    desc: 'Steelmans the opposite of whatever you\'re leaning toward. Doesn\'t stop until your reasoning survives a real challenge.',
    icon: 'ph-sword',
    accent: '#C0392B',
    activeBg: 'rgba(192,57,43,0.07)',
    activeIconBg: 'rgba(192,57,43,0.14)',
  },
]

function CoachingStylePicker({ value, onChange }: { value: CoachingStyle; onChange: (v: CoachingStyle) => void }) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 14 }}>
        HOW BLINDSPOT SHOWS UP
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {COACHING_STYLES.map(s => {
          const on = value === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              style={{
                textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '15px 16px',
                border: `1.5px solid ${on ? s.accent : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                background: on ? s.activeBg : 'var(--card)',
                cursor: 'pointer', transition: 'border-color 150ms, background 150ms',
              }}
            >
              <span style={{
                flexShrink: 0, width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: on ? s.activeIconBg : 'var(--muted)',
                color: on ? s.accent : 'var(--fg-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms, color 150ms',
              }}>
                <i className={`ph ${s.icon}`} style={{ fontSize: 20 }} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: on ? s.accent : 'var(--fg)' }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.tagline}</span>
                </span>
                <span style={{ display: 'block', fontSize: 13, lineHeight: '19px', color: 'var(--fg-muted)' }}>{s.desc}</span>
              </span>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: 9999, marginTop: 2,
                border: on ? 'none' : '1.5px solid var(--border)',
                background: on ? s.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms',
              }}>
                {on && <i className="ph-bold ph-check" style={{ fontSize: 12, color: '#fff' }} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function isAnswered(q: Question, ans: Answers): boolean {
  if (q.kind === 'scale') return (ans[q.id as keyof Answers] as number) >= 1
  return ((ans[q.id as keyof Answers] as string[]).length) >= q.min
}

const RISK_WORDS  = ['', 'Protective', 'Cautious', 'Balanced', 'Bold', 'Upside-seeking']
const PACE_WORDS  = ['', 'Deliberate', 'Reflective', 'Balanced', 'Decisive', 'Fast-moving']
const PUSH_WORDS  = ['', 'Light touch', 'Gentle', 'Balanced', 'Firm', 'Adversarial']

export function Profile({ data, isFresh }: Props) {
  const [mode, setMode] = useState<'questions' | 'summary' | 'view'>(isFresh ? 'questions' : 'view')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>(emptyAnswers())
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>('advisor')

  const q = QUESTIONS[step]
  const answered = isAnswered(q, answers)

  function toggleMulti(qid: string, key: string) {
    const cur = (answers[qid as keyof Answers] as string[])
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]
    setAnswers({ ...answers, [qid]: next })
  }

  function setScale(qid: string, n: number) {
    const cur = answers[qid as keyof Answers] as number
    setAnswers({ ...answers, [qid]: cur === n ? 0 : n })
  }

  function goNext() {
    if (!answered) return
    if (step < QUESTIONS.length - 1) setStep(step + 1)
    else setMode('summary')
  }

  function goBack() {
    if (step > 0) setStep(step - 1)
  }

  function restart() {
    setAnswers(emptyAnswers())
    setStep(0)
    setMode('questions')
  }

  // ── Questions ─────────────────────────────────────────────────────────────
  if (mode === 'questions') {
    const progress = Math.round(((step + (answered ? 1 : 0.35)) / QUESTIONS.length) * 100)

    return (
      <div className="screen animate-enter" style={{ maxWidth: 660 }}>
        {/* Progress */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, letterSpacing: '0.03em', color: 'var(--blue-ink-600)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ph ph-user-circle" style={{ fontSize: 15 }} />
              Profile diagnostic
            </span>
            <span className="muted" style={{ fontSize: 13 }}>Step {step + 1} of {QUESTIONS.length}</span>
          </div>
          <div style={{ height: 5, borderRadius: 9999, background: 'var(--muted)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 9999, background: 'var(--blue-ink-600)', width: `${progress}%`, transition: 'width 300ms var(--ease-out)' }} />
          </div>
        </div>

        {/* Question */}
        <div key={`q${step}`} style={{ animation: 'di-enter 260ms var(--ease-out)' }}>
          <h2 style={{ marginBottom: 8 }}>{q.title}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{q.subtitle}</p>

          {q.kind === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map(opt => {
                const on = (answers[q.id as keyof Answers] as string[]).includes(opt.key)
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleMulti(q.id, opt.key)}
                    style={{
                      textAlign: 'left', display: 'flex', gap: 13, alignItems: 'flex-start',
                      padding: '15px 16px',
                      border: `1px solid ${on ? 'var(--blue-ink-500)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      background: on ? 'var(--blue-ink-50)' : 'var(--card)',
                      cursor: 'pointer', transition: 'border-color 150ms, background 150ms',
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 38, height: 38, borderRadius: 'var(--radius-md)',
                      background: on ? 'var(--blue-ink-100)' : 'var(--muted)',
                      color: on ? 'var(--blue-ink-700)' : 'var(--fg-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 150ms, color 150ms',
                    }}>
                      <i className={`ph ${opt.icon}`} style={{ fontSize: 19 }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: 'var(--fg)', marginBottom: 2 }}>{opt.label}</span>
                      <span style={{ display: 'block', fontSize: 13, lineHeight: '19px', color: 'var(--fg-muted)' }}>{opt.desc}</span>
                    </span>
                    <span style={{
                      flexShrink: 0, width: 22, height: 22, borderRadius: 9999,
                      border: on ? 'none' : '1.5px solid var(--border)',
                      background: on ? 'var(--blue-ink-600)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1, transition: 'background 150ms, border-color 150ms',
                    }}>
                      {on && <i className="ph-bold ph-check" style={{ fontSize: 12, color: '#fff' }} />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {q.kind === 'scale' && (
            <div>
              <div style={{ display: 'flex', marginBottom: 14 }}>
                {[1,2,3,4,5].map(n => {
                  const on = (answers[q.id as keyof Answers] as number) === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScale(q.id, n)}
                      style={{
                        flex: 1, textAlign: 'center', padding: '14px 10px',
                        border: `1px solid ${on ? 'var(--blue-ink-500)' : 'var(--border)'}`,
                        background: on ? 'var(--blue-ink-50)' : 'var(--card)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        position: 'relative', zIndex: on ? 1 : 0,
                        borderLeft: n > 1 ? 'none' : `1px solid ${on ? 'var(--blue-ink-500)' : 'var(--border)'}`,
                        borderRadius: n === 1 ? 'var(--radius-md) 0 0 var(--radius-md)' : n === 5 ? '0 var(--radius-md) var(--radius-md) 0' : 0,
                        transition: 'border-color 150ms, background 150ms',
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 500, color: on ? 'var(--blue-ink-700)' : 'var(--fg-muted)' }}>{n}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-muted)', marginBottom: 14 }}>
                <span>{q.scaleLow}</span>
                <span>{q.scaleHigh}</span>
              </div>
              {(answers[q.id as keyof Answers] as number) >= 1 && (
                <div style={{
                  padding: '13px 15px',
                  background: 'var(--blue-ink-50)',
                  border: '1px solid var(--blue-ink-100)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13.5,
                  lineHeight: '21px',
                  color: 'var(--blue-ink-800)',
                }}>
                  {q.notes[(answers[q.id as keyof Answers] as number) - 1]}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <button
            disabled={step === 0}
            onClick={goBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 16px',
              border: 'none', background: 'none', color: step === 0 ? 'var(--border)' : 'var(--fg-muted)',
              cursor: step === 0 ? 'default' : 'pointer', fontSize: 15, borderRadius: 'var(--radius-md)',
            }}
          >
            <i className="ph ph-arrow-left" style={{ fontSize: 15 }} />Back
          </button>
          <button
            className="btn-lime"
            disabled={!answered}
            onClick={goNext}
          >
            {step === QUESTIONS.length - 1 ? 'See my profile' : 'Continue'}
            <i className="ph-bold ph-arrow-right" />
          </button>
        </div>
      </div>
    )
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (mode === 'summary') {
    const risk = answers.risk
    const pace = answers.pace
    const push = answers.push

    const areasDef = (QUESTIONS[0] as Extract<Question, {kind: 'cards'}>).options
    const strugglesDef = (QUESTIONS[1] as Extract<Question, {kind: 'cards'}>).options
    const triggersDef = (QUESTIONS[4] as Extract<Question, {kind: 'cards'}>).options
    const consultDef = (QUESTIONS[6] as Extract<Question, {kind: 'cards'}>).options

    const sumAreas = answers.areas.map(k => areasDef.find(o => o.key === k)!).filter(Boolean)
    const sumStruggles = answers.struggles.map(k => strugglesDef.find(o => o.key === k)!).filter(Boolean)
    const sumTriggers = answers.triggers.map(k => triggersDef.find(o => o.key === k)!).filter(Boolean)
    const sumConsult = answers.consult.map(k => consultDef.find(o => o.key === k)!).filter(Boolean)

    const pushQ = QUESTIONS[5] as Extract<Question, {kind: 'scale'}>
    const riskQ = QUESTIONS[2] as Extract<Question, {kind: 'scale'}>
    const paceQ = QUESTIONS[3] as Extract<Question, {kind: 'scale'}>

    return (
      <div className="screen animate-enter" style={{ maxWidth: 660 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, color: 'var(--success)' }}>
            <i className="ph-fill ph-check-circle" style={{ fontSize: 20 }} />
            <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>Diagnostic complete</span>
          </div>
          <h2 style={{ marginBottom: 8 }}>Your decision profile</h2>
          <p className="muted" style={{ marginBottom: 28 }}>Blindspot calibrates every interrogation and pattern check against this. Update it any time.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Areas */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 12 }}>Where you'll use Blindspot</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sumAreas.map(a => (
                <span key={a.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 13px', borderRadius: 9999, background: 'var(--blue-ink-50)', color: 'var(--blue-ink-800)', fontSize: 13.5 }}>
                  <i className={`ph ${a.icon}`} style={{ fontSize: 14, color: 'var(--blue-ink-600)' }} />
                  {a.label}
                </span>
              ))}
            </div>
          </div>

          {/* Struggles */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 12 }}>Where decisions get hard for you</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {sumStruggles.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <i className={`ph ${s.icon}`} style={{ fontSize: 17, color: 'var(--fg-muted)' }} />
                  <span style={{ fontSize: 14, color: 'var(--fg)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Triggers */}
          {sumTriggers.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 12 }}>What tips you into a call you regret</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sumTriggers.map(t => (
                  <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 13px', borderRadius: 9999, background: 'rgba(146,96,10,0.09)', color: '#6b470a', fontSize: 13.5 }}>
                    <i className={`ph ${t.icon}`} style={{ fontSize: 14 }} />
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk + Pace */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 8 }}>Risk tolerance</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--fg)', marginBottom: 4 }}>{RISK_WORDS[risk] || '—'}</div>
              <div style={{ fontSize: 12.5, lineHeight: '19px', color: 'var(--fg-muted)' }}>{risk ? riskQ.notes[risk - 1] : ''}</div>
            </div>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 8 }}>Decision pace</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--fg)', marginBottom: 4 }}>{PACE_WORDS[pace] || '—'}</div>
              <div style={{ fontSize: 12.5, lineHeight: '19px', color: 'var(--fg-muted)' }}>{pace ? paceQ.notes[pace - 1] : ''}</div>
            </div>
          </div>

          {/* Push + Consult */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 8 }}>How hard Blindspot pushes</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--fg)', marginBottom: 4 }}>{PUSH_WORDS[push] || '—'}</div>
              <div style={{ fontSize: 12.5, lineHeight: '19px', color: 'var(--fg-muted)' }}>{push ? pushQ.notes[push - 1] : ''}</div>
            </div>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.03em', color: 'var(--fg-muted)', marginBottom: 12 }}>Whose voice is already in the room</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {sumConsult.map(c => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className={`ph ${c.icon}`} style={{ fontSize: 16, color: 'var(--fg-muted)' }} />
                    <span style={{ fontSize: 13.5, color: 'var(--fg)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coaching style */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', padding: '18px 20px' }}>
            <CoachingStylePicker value={coachingStyle} onChange={setCoachingStyle} />
          </div>

          {/* Calibration note */}
          <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid var(--blue-ink-100)', background: 'var(--blue-ink-50)', borderRadius: 'var(--radius-lg)' }}>
            <i className="ph-fill ph-sparkle" style={{ fontSize: 18, color: 'var(--blue-ink-600)', marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--blue-ink-900)', marginBottom: 3 }}>How Blindspot will use this</div>
              <div style={{ fontSize: 13.5, lineHeight: '21px', color: 'var(--blue-ink-800)' }}>
                {sumStruggles.length > 0 ? `Interrogations will target your tendency to ${sumStruggles[0].label.toLowerCase()}.` : 'Calibrating to your profile.'}{' '}
                {risk >= 4 ? 'Given your appetite for upside, it will insist the downside is named before irreversible calls.' : risk > 0 && risk <= 2 ? 'Given your caution, it will show what the safe option quietly costs.' : ''}
                {push >= 4 ? ' At your setting, it argues the opposite case until your reasoning holds.' : push > 0 && push <= 2 ? ' At your setting, it stays light — questions, not arguments.' : ''}
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn-lime" onClick={() => setMode('view')}>
            <i className="ph-bold ph-check" style={{ fontSize: 15 }} />
            Save profile
          </button>
          <button
            onClick={restart}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 16px', border: 'none', background: 'none', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: 15, borderRadius: 'var(--radius-md)' }}
          >
            <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 15 }} />
            Retake diagnostic
          </button>
        </div>
      </div>
    )
  }

  // ── View ──────────────────────────────────────────────────────────────────
  const { profile } = data
  return (
    <div className="screen animate-enter">
      <div>
        <h2>Your Profile</h2>
        <div className="divider-line" />
        <p className="lead">Blindspot uses your profile to calibrate interrogation questions to your context.</p>
      </div>

      <div className="card">
        <div className="card-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="profile-ring">
              <div className="profile-avatar">{profile.initials}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--fg)' }}>{profile.name}</div>
              <div className="muted" style={{ marginTop: 2 }}>{profile.role}</div>
            </div>
          </div>
        </div>
        <div className="card-section">
          <div className="label-xs" style={{ marginBottom: 8 }}>Decision context</div>
          <p style={{ fontSize: 15, lineHeight: '24px', color: 'var(--fg)' }}>{profile.decisionContext}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="label-xs">Calibration</div>
            <span style={{ fontSize: 22, fontFamily: 'var(--font-serif)', color: 'var(--fg)' }}>{profile.calibration}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${profile.calibration}%`, height: '100%', background: 'var(--lime)', borderRadius: 3, transition: 'width 600ms var(--ease-out)' }} />
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            {profile.calibration < 25
              ? 'Just getting started. Log more decisions to improve calibration.'
              : profile.calibration < 60
              ? 'Building signal. Each decision and reflection improves the pattern engine.'
              : 'Strong calibration. The interrogation is well-tuned to your decision patterns.'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-section">
          <CoachingStylePicker value={coachingStyle} onChange={setCoachingStyle} />
        </div>
      </div>

      <div style={{ border: '1px solid var(--blue-ink-100)', background: 'var(--blue-ink-50)', borderRadius: 'var(--radius-xl)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <i className="ph-fill ph-sparkle" style={{ fontSize: 20, color: 'var(--blue-ink-600)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--blue-ink-700)', marginBottom: 3 }}>Retake the diagnostic</div>
          <div className="muted" style={{ fontSize: 13 }}>Update your profile so the interrogation stays calibrated as your situation evolves.</div>
        </div>
        <button className="btn-outline" onClick={restart}>Retake</button>
      </div>
    </div>
  )
}
