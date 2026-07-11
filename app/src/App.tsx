import { useState } from 'react'
import { DemoPicker } from './DemoPicker'
import { Profile } from './Profile'
import { DecisionInterrogation } from './DecisionInterrogation'
import { DecisionLog } from './DecisionLog'
import { Reflections } from './Reflections'
import { Patterns } from './Patterns'
import { freshData, seasonedData, sampleInterrogation } from './data'
import type { AppData, DemoMode, Screen } from './types'
import './index.css'

const NAV = [
  { id: 'log',         label: 'Decisions',   icon: 'ph-fill ph-scales'     },
  { id: 'reflections', label: 'Reflections', icon: 'ph ph-arrow-u-up-left' },
  { id: 'patterns',    label: 'Patterns',    icon: 'ph ph-chart-line-up'   },
  { id: 'profile',     label: 'Profile',     icon: 'ph ph-user'            },
] as const

function getActiveData(mode: DemoMode): AppData {
  return mode === 'seasoned' ? seasonedData : freshData
}

export default function App() {
  const [demoMode, setDemoMode] = useState<DemoMode>('picker')
  const [screen, setScreen] = useState<Screen>('log')

  if (demoMode === 'picker') {
    return <DemoPicker onSelect={mode => { setDemoMode(mode); setScreen('log') }} />
  }

  const data = getActiveData(demoMode)
  const isFresh = demoMode === 'fresh'

  const pendingReflections = data.reflections.filter(r => !r.completedAt).length
  const activePatterns = data.patterns.filter(p => !p.dismissed).length

  const interrogationTitle = isFresh ? sampleInterrogation.title : 'New interrogation'

  const topbarTitle =
    screen === 'interrogation' ? interrogationTitle :
    screen === 'log'           ? 'Decision Log' :
    screen === 'reflections'   ? 'Reflections' :
    screen === 'patterns'      ? 'Patterns' :
                                 'Profile'

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-header">
          <span className="sb-wordmark">Blindspot</span>
          <button className="sb-collapse" aria-label="Collapse">
            <i className="ph-bold ph-caret-double-left" style={{ fontSize: 15 }} />
          </button>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="sb-avatar-ring">
            <svg viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              {data.profile.calibration > 0 && (
                <circle cx="42" cy="42" r="38" fill="none" stroke="#B8D14A" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray="238.8"
                  strokeDashoffset={238.8 - (238.8 * data.profile.calibration / 100)} />
              )}
            </svg>
            <span className="sb-avatar-inner">{data.profile.initials}</span>
            {(pendingReflections + activePatterns) > 0 && (
              <span className="sb-avatar-badge">{pendingReflections + activePatterns}</span>
            )}
          </div>
          <div className="sb-name">{data.profile.name}</div>
          {data.profile.calibration > 0 ? (
            <div className="sb-calibration">
              <span className="sb-dot" />
              Calibration {data.profile.calibration}%
            </div>
          ) : (
            <div className="sb-calibration" style={{ color: '#8E80A0' }}>
              <span className="sb-dot" style={{ background: '#8E80A0' }} />
              Not yet calibrated
            </div>
          )}
        </div>

        <div className="sb-divider" />

        {/* Nav */}
        <nav className="sb-nav">
          {NAV.map(item => {
            const badge =
              item.id === 'reflections' ? pendingReflections :
              item.id === 'patterns'    ? activePatterns :
              null
            const isActive = screen === item.id || (screen === 'interrogation' && item.id === 'log')
            return (
              <button
                key={item.id}
                className={`sb-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setScreen(item.id as Screen)}
              >
                <span className="sb-nav-icon">
                  <i className={item.icon} style={{ fontSize: 17 }} />
                </span>
                {item.label}
                {badge !== null && badge > 0 && (
                  <span className="sb-nav-badge">{badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Follow-up widget or empty state hint */}
        {pendingReflections > 0 ? (
          <div className="sb-followup" onClick={() => setScreen('reflections')} style={{ cursor: 'pointer' }}>
            <div className="sb-followup-header">
              <span className="sb-dot" />
              <span className="sb-followup-label">{pendingReflections} follow-up{pendingReflections > 1 ? 's' : ''} due</span>
              <i className="ph-bold ph-caret-up" style={{ fontSize: 13, color: '#CDE07A' }} />
            </div>
            <div className="sb-followup-body">
              {data.reflections.find(r => !r.completedAt)
                ? data.decisions.find(d => d.id === data.reflections.find(r => !r.completedAt)?.decisionId)?.title?.slice(0, 50) + '…'
                : 'A past decision is ready for its check-in.'}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#8E80A0', marginBottom: 4 }}>Demo mode</div>
            <button
              onClick={() => setDemoMode('picker')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8D14A', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ph ph-arrows-clockwise" style={{ fontSize: 13 }} />
              Switch view
            </button>
          </div>
        )}

        {/* Always show switch view at bottom when seasoned */}
        {demoMode === 'seasoned' && (
          <div style={{ marginTop: 8, padding: '10px 14px' }}>
            <button
              onClick={() => setDemoMode('picker')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E80A0', fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ph ph-arrows-clockwise" style={{ fontSize: 12 }} />
              Switch demo view
            </button>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="row gap-2">
            <i className="ph ph-arrow-left" style={{ fontSize: 16, color: 'var(--fg-muted)' }} />
            <span className="topbar-title">{topbarTitle}</span>
            {screen === 'interrogation' && <span className="topbar-badge">Draft</span>}
          </div>
          <button className="topbar-save" onClick={() => setDemoMode('picker')}>
            <i className="ph ph-arrows-clockwise" style={{ fontSize: 15 }} />
            {isFresh ? 'Fresh view' : 'Seasoned view'}
          </button>
        </header>

        {/* Content */}
        {screen === 'interrogation' ? (
          <DecisionInterrogation
            isFresh={isFresh}
            onComplete={() => setScreen('log')}
          />
        ) : (
          <div className="content">
            <div className="content-inner animate-enter" key={screen}>
              {screen === 'log'         && <DecisionLog data={data} onStartInterrogation={() => setScreen('interrogation')} />}
              {screen === 'reflections' && <Reflections data={data} />}
              {screen === 'patterns'    && <Patterns data={data} />}
              {screen === 'profile'     && <Profile data={data} isFresh={isFresh} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
