import { useState } from 'react'
import { sampleProfile } from './data'
import type { UserProfile } from './types'

export function Profile() {
  const [profile, setProfile] = useState<UserProfile>(sampleProfile)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  function save() {
    setProfile(draft)
    setEditing(false)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Your Profile</h1>
        <p className="muted">Blindspot uses your profile to personalize the interrogation questions to your context.</p>
      </div>

      {editing ? (
        <div className="card">
          <div className="field">
            <label>Name</label>
            <input
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Role / Life stage</label>
            <input
              value={draft.role}
              onChange={e => setDraft({ ...draft, role: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Decision context</label>
            <textarea
              value={draft.decisionContext}
              onChange={e => setDraft({ ...draft, decisionContext: e.target.value })}
              rows={3}
            />
          </div>
          <div className="row gap-sm">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="profile-row">
            <div className="avatar">{profile.name[0]}</div>
            <div>
              <h2>{profile.name}</h2>
              <p className="muted">{profile.role}</p>
            </div>
          </div>
          <p>{profile.decisionContext}</p>
          <button className="btn" onClick={() => { setDraft(profile); setEditing(true) }}>
            Edit profile
          </button>
        </div>
      )}
    </div>
  )
}
