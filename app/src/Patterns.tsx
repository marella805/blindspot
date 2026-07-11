import { useState } from 'react'
import { samplePatterns, sampleDecisions } from './data'
import type { PatternAlert } from './types'

export function Patterns() {
  const [patterns, setPatterns] = useState<PatternAlert[]>(samplePatterns)

  function dismiss(id: string) {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, dismissed: true } : p))
  }

  function getDecisionTitle(id: string) {
    return sampleDecisions.find(d => d.id === id)?.title ?? 'Unknown decision'
  }

  const active = patterns.filter(p => !p.dismissed)
  const dismissed = patterns.filter(p => p.dismissed)

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Pattern Engine</h1>
        <p className="muted">Cross-decision patterns detected from your log. Gets more powerful as your log grows.</p>
      </div>

      {active.length === 0 && dismissed.length === 0 && (
        <div className="empty">
          <p>No patterns detected yet. Log at least 3 decisions to activate the pattern engine.</p>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <div className="list">
            {active.map(p => (
              <div key={p.id} className="list-item pattern-alert">
                <div className="pattern-icon">⚡</div>
                <div className="pattern-body">
                  <strong>{p.title}</strong>
                  <p className="small">{p.description}</p>
                  <div className="pattern-decisions">
                    {p.relatedDecisionIds.map(id => (
                      <span key={id} className="badge">{getDecisionTitle(id).slice(0, 40)}…</span>
                    ))}
                  </div>
                  <button className="btn-dismiss" onClick={() => dismiss(p.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {dismissed.length > 0 && (
        <section>
          <h2 className="section-title muted">Dismissed</h2>
          <div className="list">
            {dismissed.map(p => (
              <div key={p.id} className="list-item list-item-muted">
                <strong className="muted">{p.title}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
