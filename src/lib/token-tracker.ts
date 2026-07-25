import { db } from './db'
import { tokenLogs } from './db/schema'

type TokenUsage = {
  model: string
  route: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export function logTokenUsage(usage: TokenUsage) {
  const cost = estimateCost(usage.model, usage.promptTokens, usage.completionTokens)
  console.log(
    `[tokens] ${usage.route} | ${usage.model} | ` +
    `prompt=${usage.promptTokens} completion=${usage.completionTokens} ` +
    `total=${usage.totalTokens} | est=$${cost}`
  )
  db.insert(tokenLogs).values({ ...usage, estimatedCostUsd: cost }).catch(console.error)
}

function estimateCost(model: string, prompt: number, completion: number): string {
  const rates: Record<string, { prompt: number; completion: number }> = {
    'llama-3.3-70b-versatile': { prompt: 0.59, completion: 0.79 },
    'llama-3.1-8b-instant':    { prompt: 0.05, completion: 0.08 },
  }
  const rate = rates[model]
  if (!rate) return '?'
  const usd = (prompt / 1_000_000) * rate.prompt + (completion / 1_000_000) * rate.completion
  return usd.toFixed(6)
}
