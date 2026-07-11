import { useState, useRef, useEffect } from 'react'
import type { InterrogationMessage } from './types'

interface Props {
  onComplete: () => void
}

const OPENING = "Let's stress-test this decision. Start by describing it in one or two sentences — what are you actually deciding?"

const PROBES: string[] = [
  "What's the real reason you're leaning that way — strip away the justification?",
  "Who else is influencing this decision, and how much weight are you giving them?",
  "What would you need to see to change your mind? Be specific.",
  "What's the cost of being wrong here? Walk me through the worst-case.",
  "You said [X]. Is that actually true, or is it what you're hoping is true?",
  "What are you not letting yourself consider?",
  "If you made this choice and it went badly, what would you tell yourself you missed?",
]

export function DecisionInterrogation({ onComplete }: Props) {
  const [title, setTitle] = useState('')
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<InterrogationMessage[]>([])
  const [input, setInput] = useState('')
  const [done, setDone] = useState(false)
  const [probeIndex, setProbeIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function start() {
    if (!title.trim()) return
    setStarted(true)
    setMessages([{
      role: 'assistant',
      content: OPENING,
      timestamp: new Date().toISOString(),
    }])
  }

  function send() {
    if (!input.trim()) return
    const userMsg: InterrogationMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    const nextProbeIndex = probeIndex + 1
    const isDone = nextProbeIndex >= PROBES.length

    const assistantMsg: InterrogationMessage = {
      role: 'assistant',
      content: isDone
        ? "That's enough to work with. Here's what I'm seeing: the reasoning you've articulated holds up under pressure, but the real driver behind this decision is clearer now than when you started. I've saved a summary to your log."
        : PROBES[probeIndex].replace('[X]', input.split(' ').slice(0, 4).join(' ')),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setProbeIndex(nextProbeIndex)

    if (isDone) setDone(true)
  }

  if (!started) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>New Interrogation</h1>
          <p className="muted">Name the decision. The interrogation will push back on your reasoning until the real driver is visible.</p>
        </div>
        <div className="card">
          <div className="field">
            <label>What are you deciding?</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Accept the Berkeley offer vs wait for NYU"
              onKeyDown={e => e.key === 'Enter' && start()}
              autoFocus
            />
          </div>
          <button className="btn btn-primary" onClick={start} disabled={!title.trim()}>
            Start
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen-chat">
      <div className="chat-header">
        <h2>{title}</h2>
        <span className="badge">{Math.round((probeIndex / PROBES.length) * 100)}% depth</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {done ? (
        <div className="chat-done">
          <p className="muted">Interrogation complete. Entry saved to your log.</p>
          <button className="btn btn-primary" onClick={onComplete}>
            View log
          </button>
        </div>
      ) : (
        <div className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Reply..."
            autoFocus
          />
          <button className="btn btn-primary" onClick={send} disabled={!input.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  )
}
