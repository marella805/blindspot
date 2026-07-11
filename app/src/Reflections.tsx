import { useState } from 'react'
import type { AppData, ReflectionRecord } from './types'

interface Props {
  data: AppData
}

export function Reflections({ data }: Props) {
  const [reflections, setReflections] = useState<ReflectionRecord[]>(data.reflections)
  const [active, setActive] = useState<string | null>(null)
  const [text, setText] = useState('')

  function getDecisionTitle(id: string) {
    return data.decisions.find(d => d.id === id)?.title ?? 'Unknown decision'
  }

  function completeReflection(id: string) {
    setReflections(prev =>
      prev.map(r => r.id === id ? { ...r, completedAt: new Date().toISOString(), content: text } : r)
    )
    setActive(null)
    setText('')
  }

  const pending = reflections.filter(r => !r.completedAt)
  const completed = reflections.filter(r => r.completedAt)

  if (reflections.length === 0) {
    return (
      <div className="screen">
        <div>
          <h2>Reflections</h2>
          <div className="divider-line" />
          <p className="lead">Scheduled prompts to revisit past decisions and close the feedback loop.</p>
        </div>
        <div className="empty">
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <i className="ph ph-arrow-u-up-left" style={{ fontSize: 30, color: 'var(--blue-ink-600)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>No reflections yet</h3>
          <p className="muted">Reflections are scheduled automatically — 1 month and 3 months after each decision you log.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div>
        <h2>Reflections</h2>
        <div className="divider-line" />
        <p className="lead">Scheduled prompts to revisit past decisions and close the feedback loop.</p>
      </div>

      {pending.length > 0 && (
        <div>
          <div className="label-xs" style={{ marginBottom: 10 }}>
            Due ({pending.length})
          </div>
          <div className="list">
            {pending.map(r => (
              <div key={r.id} className="list-item" style={{ cursor: 'default' }}>
                <div className="list-item-row">
                  <span className="list-item-title" style={{ fontSize: 14 }}>{getDecisionTitle(r.decisionId)}</span>
                  <span className="badge badge-info">{r.type === '1month' ? '1-month' : '3-month'} check-in</span>
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Scheduled for {fmt(r.scheduledFor)}</span>

                {active === r.id ? (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: 'var(--blue-ink-50)', border: '1px solid var(--blue-ink-100)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, color: 'var(--blue-ink-700)', lineHeight: '20px' }}>
                        <strong>Prompt:</strong> How did this decision play out? What do you know now that you didn't when you made it? Was the reasoning you wrote down accurate?
                      </p>
                    </div>
                    <textarea
                      rows={4}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Write your reflection…"
                      style={{
                        padding: '12px 14px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--input)', background: 'var(--card)',
                        fontSize: 15, lineHeight: '24px', resize: 'none', outline: 'none',
                        width: '100%', transition: 'border-color 150ms, box-shadow 150ms',
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-lime" disabled={!text.trim()} onClick={() => completeReflection(r.id)}>
                        Save reflection
                      </button>
                      <button className="btn-outline" onClick={() => setActive(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-outline" onClick={() => { setActive(r.id); setText('') }} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                    <i className="ph ph-pencil" style={{ fontSize: 14 }} />
                    Write reflection
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <div className="label-xs" style={{ marginBottom: 10 }}>Completed ({completed.length})</div>
          <div className="list">
            {completed.map(r => (
              <div key={r.id} className="list-item" style={{ cursor: 'default' }}>
                <div className="list-item-row">
                  <span className="list-item-title" style={{ fontSize: 14 }}>{getDecisionTitle(r.decisionId)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge" style={{ background: 'var(--muted)', color: 'var(--fg-muted)' }}>
                      {r.type === '1month' ? '1-month' : '3-month'}
                    </span>
                    <span className="badge badge-success">Done</span>
                  </div>
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Completed {r.completedAt ? fmt(r.completedAt) : ''}</span>
                {r.content && (
                  <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 14, marginTop: 10 }}>
                    <p style={{ fontSize: 14, lineHeight: '22px', color: 'var(--fg)', fontStyle: 'italic' }}>{r.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
