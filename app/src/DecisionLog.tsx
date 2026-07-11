import { useState } from 'react'
import { sampleDecisions } from './data'
import type { DecisionEntry } from './types'

interface Props {
  onStartInterrogation: () => void
}

export function DecisionLog({ onStartInterrogation }: Props) {
  const [decisions] = useState<DecisionEntry[]>(sampleDecisions)
  const [selected, setSelected] = useState<DecisionEntry | null>(null)

  if (selected) {
    return <DecisionDetail entry={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <h1>Decision Log</h1>
          <p className="muted">{decisions.length} decisions recorded</p>
        </div>
        <button className="btn btn-primary" onClick={onStartInterrogation}>
          + New decision
        </button>
      </div>

      <div className="list">
        {decisions.map(d => (
          <button key={d.id} className="list-item" onClick={() => setSelected(d)}>
            <div className="list-item-header">
              <span className="list-item-title">{d.title}</span>
              {d.lockedAt && <span className="badge badge-locked">Locked</span>}
            </div>
            <p className="muted small">{new Date(d.createdAt).toLocaleDateString()}</p>
            <p className="small">{d.summary.slice(0, 120)}…</p>
          </button>
        ))}
      </div>

      {decisions.length === 0 && (
        <div className="empty">
          <p>No decisions yet. Start an interrogation to log your first one.</p>
          <button className="btn btn-primary" onClick={onStartInterrogation}>
            Start interrogation
          </button>
        </div>
      )}
    </div>
  )
}

function DecisionDetail({ entry, onBack }: { entry: DecisionEntry; onBack: () => void }) {
  return (
    <div className="screen">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="screen-header">
        <h1>{entry.title}</h1>
        <div className="row gap-sm">
          <span className="muted small">{new Date(entry.createdAt).toLocaleDateString()}</span>
          {entry.lockedAt && <span className="badge badge-locked">Locked</span>}
          {!entry.manualEntry && <span className="badge">Interrogated</span>}
        </div>
      </div>

      <div className="card">
        <h3>Summary</h3>
        <p>{entry.summary}</p>
      </div>

      <div className="card">
        <h3>Options</h3>
        {entry.options.map(opt => (
          <div key={opt.id} className={`option ${entry.chosenOption === opt.id ? 'option-chosen' : ''}`}>
            <div className="option-header">
              <strong>{opt.label}</strong>
              {entry.chosenOption === opt.id && <span className="badge badge-chosen">Chosen</span>}
            </div>
            <div className="option-cols">
              <div>
                <p className="small muted">Pros</p>
                <ul>{opt.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div>
                <p className="small muted">Cons</p>
                <ul>{opt.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {entry.reasoning && (
        <div className="card">
          <h3>Reasoning</h3>
          <p>{entry.reasoning}</p>
        </div>
      )}
    </div>
  )
}
