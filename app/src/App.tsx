import { useState } from 'react'
import { Profile } from './Profile'
import { DecisionInterrogation } from './DecisionInterrogation'
import { DecisionLog } from './DecisionLog'
import { Reflections } from './Reflections'
import { Patterns } from './Patterns'
import type { Screen } from './types'
import './index.css'

export default function App() {
  const [screen, setScreen] = useState<Screen>('log')

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-brand">Blindspot</span>
        <div className="nav-links">
          <button
            className={screen === 'log' ? 'active' : ''}
            onClick={() => setScreen('log')}
          >
            Log
          </button>
          <button
            className={screen === 'interrogation' ? 'active' : ''}
            onClick={() => setScreen('interrogation')}
          >
            Interrogate
          </button>
          <button
            className={screen === 'reflections' ? 'active' : ''}
            onClick={() => setScreen('reflections')}
          >
            Reflections
          </button>
          <button
            className={screen === 'patterns' ? 'active' : ''}
            onClick={() => setScreen('patterns')}
          >
            Patterns
          </button>
          <button
            className={screen === 'profile' ? 'active' : ''}
            onClick={() => setScreen('profile')}
          >
            Profile
          </button>
        </div>
      </nav>

      <main className="main">
        {screen === 'log' && <DecisionLog onStartInterrogation={() => setScreen('interrogation')} />}
        {screen === 'interrogation' && <DecisionInterrogation onComplete={() => setScreen('log')} />}
        {screen === 'reflections' && <Reflections />}
        {screen === 'patterns' && <Patterns />}
        {screen === 'profile' && <Profile />}
      </main>
    </div>
  )
}
