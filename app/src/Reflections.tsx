import { useState } from 'react'
import { sampleReflections, sampleDecisions } from './data'
import type { ReflectionRecord } from './types'

export function Reflections() {
  const [reflections] = useState<ReflectionRecord[]>(sampleReflections)
  const [active, setActive] = useState<string | null>(null)
  const [text, setText] = useState('')

  const pending = reflections.filter(r => !r.completedAt)
  const completed = reflections.filter(r => r.completedAt)

  function getDecisionTitle(id: string) {
    return sampleDecisions.find(d => d.id === id)?.title ?? 'Unknown decision'
  }

  function formatScheduled(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Reflections</h1>
        <p className="muted">Scheduled prompts to revisit past decisions and close the feedback loop.</p>
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="section-title">Pending</h2>
          <div className="list">
            {pending.map(r => (
              <div key={r.id} className="list-item">
                <div className="list-item-header">
                  <span className="list-item-title">{getDecisionTitle(r.decisionId)}</span>
                  <span className="badge">{r.type === '1month' ? '1-month' : '3-month'}</span>
                </div>
                <p className="small muted">Scheduled for {formatScheduled(r.scheduledFor)}</p>

                {active === r.id ? (
                  <div className="reflection-input">
                    <textarea
                      placeholder="How did this decision play out? What do you know now that you didn't then?"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className="row gap-sm">
                      <button className="btn btn-primary" disabled={!text.trim()}>
                        Save reflection
                      </button>
                      <button className="btn" onClick={() => setActive(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn" onClick={() => setActive(r.id)}>
                    Write reflection
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="section-title">Completed</h2>
          <div className="list">
            {completed.map(r => (
              <div key={r.id} className="list-item">
                <div className="list-item-header">
                  <span className="list-item-title">{getDecisionTitle(r.decisionId)}</span>
                  <span className="badge badge-locked">Done</span>
                </div>
                <p className="small muted">Completed {r.completedAt ? formatScheduled(r.completedAt) : ''}</p>
                {r.content && <p className="small">{r.content}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && completed.length === 0 && (
        <div className="empty">
          <p>No reflections scheduled yet. Reflections are automatically created when you log a decision.</p>
        </div>
      )}
    </div>
  )
}
