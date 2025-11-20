'use client'

import { useEffect } from 'react'
import { useCodexStore } from '@/stores'

const BACKGROUND_CHECK_INTERVAL = 1000 * 60 * 5 // Check every 5 minutes

export function CodexProvider({ children }: { children: React.ReactNode }) {
  const refreshInBackground = useCodexStore((state) => state.refreshInBackground)
  const loadCodex = useCodexStore((state) => state.loadCodex)

  useEffect(() => {
    // Load codex on mount (will use cache if available)
    loadCodex()

    // Set up background refresh interval
    const interval = setInterval(() => {
      refreshInBackground()
    }, BACKGROUND_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [loadCodex, refreshInBackground])

  return <>{children}</>
}
