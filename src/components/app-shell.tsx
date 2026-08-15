'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { id: 'log',         href: '/log',         label: 'Decision Maker',   icon: 'ph-fill ph-scales'     },
  { id: 'reflections', href: '/reflections',  label: 'Reflections', icon: 'ph ph-arrow-u-up-left' },
  { id: 'patterns',    href: '/patterns',     label: 'Patterns',    icon: 'ph ph-chart-line-up'   },
  { id: 'profile',     href: '/profile',      label: 'Profile',     icon: 'ph ph-user'            },
] as const

interface Props {
  userId: string
  userName: string
  children: React.ReactNode
  initials?: string
  calibration?: number
  pendingReflections?: number
  activePatterns?: number
}

export function AppShell({
  userName,
  children,
  initials = '',
  calibration = 0,
  pendingReflections = 0,
  activePatterns = 0,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdQuery, setCmdQuery] = useState('')
  const cmdInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => { if (!o) setCmdQuery(''); return !o })
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 50)
  }, [cmdOpen])

  const COMMANDS = [
    { icon: 'ph-fill ph-play-circle', label: 'Run demo interrogation', hint: 'Demo', action: () => { router.push('/interrogation?demo=true'); setCmdOpen(false) } },
    { icon: 'ph ph-plus',             label: 'New interrogation',       hint: '',     action: () => { router.push('/interrogation'); setCmdOpen(false) } },
    { icon: 'ph ph-scales',           label: 'Decision log',            hint: '',     action: () => { router.push('/log'); setCmdOpen(false) } },
    { icon: 'ph ph-arrow-u-up-left',  label: 'Reflections',             hint: '',     action: () => { router.push('/reflections'); setCmdOpen(false) } },
    { icon: 'ph ph-chart-line-up',    label: 'Patterns',                hint: '',     action: () => { router.push('/patterns'); setCmdOpen(false) } },
    { icon: 'ph ph-user',             label: 'Profile',                 hint: '',     action: () => { router.push('/profile'); setCmdOpen(false) } },
  ]

  const filtered = COMMANDS.filter(c =>
    !cmdQuery.trim() || c.label.toLowerCase().includes(cmdQuery.toLowerCase())
  )

  const currentNav = NAV.find(n => pathname.startsWith(n.href))?.id ?? 'log'

  const topbarTitle =
    currentNav === 'log'         ? 'Decision Log' :
    currentNav === 'reflections' ? 'Reflections' :
    currentNav === 'patterns'    ? 'Patterns' :
                                   'Profile'

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sb-header">
          {!collapsed && <span className="sb-wordmark">Blindspot</span>}
          <button
            className="sb-collapse"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
            onClick={() => setCollapsed(c => !c)}
            style={collapsed ? { margin: '0 auto' } : undefined}
          >
            <i className={`ph-bold ${collapsed ? 'ph-caret-double-right' : 'ph-caret-double-left'}`} style={{ fontSize: 15 }} />
          </button>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="sb-avatar-ring">
            <svg viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              {calibration > 0 && (
                <circle cx="42" cy="42" r="38" fill="none" stroke="#F5D98A" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray="238.8"
                  strokeDashoffset={238.8 - (238.8 * calibration / 100)} />
              )}
            </svg>
            <span className="sb-avatar-inner">{initials || userName.slice(0, 2).toUpperCase()}</span>
            {(pendingReflections + activePatterns) > 0 && (
              <span className="sb-avatar-badge">{pendingReflections + activePatterns}</span>
            )}
          </div>
          <div className="sb-name">{userName}</div>
          {calibration > 0 ? (
            <div className="sb-calibration">
              <span className="sb-dot" />
              Calibration {calibration}%
            </div>
          ) : (
            <div className="sb-calibration" style={{ color: '#a09890' }}>
              <span className="sb-dot" style={{ background: '#a09890' }} />
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
            const isActive = currentNav === item.id
            return (
              <button
                key={item.id}
                className={`sb-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => router.push(item.href)}
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

        {pendingReflections > 0 && (
          <div className="sb-followup" onClick={() => router.push('/reflections')} style={{ cursor: 'pointer' }}>
            <div className="sb-followup-header">
              <span className="sb-dot" />
              <span className="sb-followup-label">{pendingReflections} follow-up{pendingReflections > 1 ? 's' : ''} due</span>
              <i className="ph-bold ph-caret-up" style={{ fontSize: 13, color: '#CDE07A' }} />
            </div>
            <div className="sb-followup-body">
              A past decision is ready for its check-in.
            </div>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        <header className="topbar">
          <div className="row gap-2">
            <span className="topbar-title">{topbarTitle}</span>
          </div>
        </header>

        {pathname.startsWith('/interrogation') ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        ) : (
          <div className="content">
            <div className="content-inner animate-enter">
              {children}
            </div>
          </div>
        )}
      </div>

      {/* ── Command palette ── */}
      {cmdOpen && (
        <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="cmd-panel" onClick={e => e.stopPropagation()}>
            <div className="cmd-input-row">
              <i className="ph ph-magnifying-glass cmd-search-icon" />
              <input
                ref={cmdInputRef}
                placeholder="Search commands…"
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) { filtered[0].action() } }}
              />
            </div>
            <div className="cmd-results">
              <div className="cmd-section-label">Actions</div>
              {filtered.map((c, i) => (
                <div key={i} className="cmd-item" onClick={c.action}>
                  <span className="cmd-item-icon"><i className={c.icon} style={{ fontSize: 15 }} /></span>
                  <span className="cmd-item-label">{c.label}</span>
                  {c.hint && <span className="cmd-item-hint">{c.hint}</span>}
                </div>
              ))}
            </div>
            <div className="cmd-footer">
              <span><span className="cmd-key">↵</span> select</span>
              <span><span className="cmd-key">esc</span> close</span>
              <span><span className="cmd-key">⌘K</span> toggle</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
