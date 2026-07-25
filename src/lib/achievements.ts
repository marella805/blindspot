import type { AppData } from '@/types'

export const ACHIEVEMENTS = [
  { id: 'first',       icon: 'ph ph-flag-banner',             label: 'First Step',      unlocked: (d: AppData) => d.decisions.length >= 1 },
  { id: 'diver',       icon: 'ph ph-magnifying-glass',        label: 'Deep Diver',      unlocked: (d: AppData) => d.decisions.some(x => x.interrogated) },
  { id: 'fire',        icon: 'ph ph-fire',                    label: 'On Fire',         unlocked: (d: AppData) => d.profile.calibration >= 50 },
  { id: 'pattern',     icon: 'ph-fill ph-sparkle',            label: 'Pattern Spotter', unlocked: (d: AppData) => d.patterns.length > 0 },
  { id: 'calibrated',  icon: 'ph ph-crosshair',               label: 'Calibrated',      unlocked: (d: AppData) => d.profile.calibration >= 75 },
  { id: 'reflective',  icon: 'ph ph-arrow-counter-clockwise', label: 'Reflective',      unlocked: (d: AppData) => d.reflections.some(r => r.completedAt) },
  { id: 'veteran',     icon: 'ph ph-trophy',                  label: 'Veteran',         unlocked: (d: AppData) => d.decisions.length >= 5 },
  { id: 'analyst',     icon: 'ph ph-chart-bar',               label: 'Analyst',         unlocked: (d: AppData) => d.decisions.filter(x => x.interrogated).length >= 3 },
  { id: 'oracle',      icon: 'ph ph-crown',                   label: 'Oracle',          unlocked: (d: AppData) => d.decisions.length >= 15 },
]
