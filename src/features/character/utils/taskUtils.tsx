'use client'

export const parseJson = (value: unknown) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export const sanitizeName = (name: string) =>
  name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()

export const splitTitle = (title: string) =>
  title
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean)

export const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const parts = []
  if (hrs) parts.push(`${hrs}h`)
  if (mins || hrs) parts.push(`${mins}m`)
  parts.push(`${secs}s`)
  return parts.join(' ')
}

export type ProgressState = { percent: number; remaining: number; claimable: boolean }

export type TimeState = {
  started_at?: string | number
  startedAt?: string | number
  ready_at?: string | number
  readyAt?: string | number
}

export const resolveProgress = (state: TimeState | null, currentTime: number): ProgressState | null => {
  if (!state) return null
  const started = Number(state.started_at ?? state.startedAt ?? NaN)
  const ready = Number(state.ready_at ?? state.readyAt ?? NaN)
  if (!Number.isFinite(started) || !Number.isFinite(ready)) return null
  const duration = Math.max(0, ready - started)
  const elapsed = Math.max(0, currentTime - started)
  const percent = duration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100))) : 100
  const remaining = Math.max(0, ready - currentTime)
  const claimable = remaining <= 0
  return { percent, remaining, claimable }
}
