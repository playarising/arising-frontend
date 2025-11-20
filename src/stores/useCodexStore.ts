import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CodexEquipment, CodexQuest, CodexRecipe, CodexResourceMint } from '@/lib'
import { fetchCodex } from '@/lib'

type CodexData = {
  equipments: CodexEquipment[]
  quests: CodexQuest[]
  recipes: CodexRecipe[]
  resourceMints: CodexResourceMint[]
}

type CodexStore = {
  // Codex data
  codex: CodexData | null
  lastFetched: number | null
  isLoading: boolean
  error: string | null

  // Resource mint map (derived from codex)
  resourceMintMap: Map<string, { resource: string; displayName: string; mint: string }>

  // Actions
  loadCodex: (force?: boolean) => Promise<void>
  refreshInBackground: () => Promise<void>
  clear: () => void
}

const CACHE_TTL = 1000 * 60 * 30 // 30 minutes
const BACKGROUND_CHECK_INTERVAL = 1000 * 60 * 5 // Check every 5 minutes

const initialCodexData: CodexData = {
  equipments: [],
  quests: [],
  recipes: [],
  resourceMints: []
}

export const useCodexStore = create<CodexStore>()(
  persist(
    (set, get) => ({
      codex: null,
      lastFetched: null,
      isLoading: false,
      error: null,
      resourceMintMap: new Map(),

      loadCodex: async (force = false) => {
        const { codex, lastFetched, isLoading } = get()

        // Don't fetch if already loading
        if (isLoading) return

        // Check if cache is still valid
        const now = Date.now()
        const isCacheValid = lastFetched && now - lastFetched < CACHE_TTL

        // Return early if cache is valid and not forced
        if (!force && isCacheValid && codex) {
          return
        }

        try {
          set({ isLoading: true, error: null })
          const fetchedCodex = await fetchCodex()

          // Create resource mint map
          const resourceMintMap = new Map<string, { resource: string; displayName: string; mint: string }>(
            fetchedCodex.resourceMints.map((r) => [
              r.mint,
              { resource: r.resource, displayName: r.displayName, mint: r.mint }
            ])
          )

          set({
            codex: fetchedCodex,
            resourceMintMap,
            lastFetched: Date.now(),
            isLoading: false,
            error: null
          })
        } catch (error) {
          console.error('Failed to load codex:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to load codex',
            isLoading: false
          })
        }
      },

      refreshInBackground: async () => {
        const { codex } = get()

        // Only refresh if we have existing data
        if (!codex) return

        try {
          const fetchedCodex = await fetchCodex()

          // Check if data has changed
          const hasChanged =
            JSON.stringify(codex.quests) !== JSON.stringify(fetchedCodex.quests) ||
            JSON.stringify(codex.recipes) !== JSON.stringify(fetchedCodex.recipes) ||
            JSON.stringify(codex.resourceMints) !== JSON.stringify(fetchedCodex.resourceMints) ||
            JSON.stringify(codex.equipments) !== JSON.stringify(fetchedCodex.equipments)

          if (hasChanged) {
            const resourceMintMap = new Map<string, { resource: string; displayName: string; mint: string }>(
              fetchedCodex.resourceMints.map((r) => [
                r.mint,
                { resource: r.resource, displayName: r.displayName, mint: r.mint }
              ])
            )

            set({
              codex: fetchedCodex,
              resourceMintMap,
              lastFetched: Date.now()
            })
          }
        } catch (error) {
          console.error('Background codex refresh failed:', error)
          // Don't update error state for background refreshes
        }
      },

      clear: () => {
        set({
          codex: null,
          lastFetched: null,
          isLoading: false,
          error: null,
          resourceMintMap: new Map()
        })
      }
    }),
    {
      name: 'codex-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        codex: state.codex,
        lastFetched: state.lastFetched
        // Don't persist Map or loading states
      }),
      // Rehydrate the resourceMintMap after loading from storage
      onRehydrateStorage: () => (state) => {
        if (state?.codex?.resourceMints) {
          const resourceMintMap = new Map<string, { resource: string; displayName: string; mint: string }>(
            state.codex.resourceMints.map((r) => [
              r.mint,
              { resource: r.resource, displayName: r.displayName, mint: r.mint }
            ])
          )
          state.resourceMintMap = resourceMintMap
        }
      }
    }
  )
)

// Background refresh hook - call this in your app root
export function useCodexBackgroundRefresh() {
  const refreshInBackground = useCodexStore((state) => state.refreshInBackground)

  if (typeof window !== 'undefined') {
    // Set up background refresh interval
    const interval = setInterval(() => {
      refreshInBackground()
    }, BACKGROUND_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }
}

// Helper hook to ensure codex is loaded
export function useCodex() {
  const codex = useCodexStore((state) => state.codex)
  const loadCodex = useCodexStore((state) => state.loadCodex)
  const isLoading = useCodexStore((state) => state.isLoading)
  const error = useCodexStore((state) => state.error)

  // Load on mount if not already loaded
  if (!codex && !isLoading && !error) {
    loadCodex()
  }

  return {
    codex: codex || initialCodexData,
    isLoading,
    error,
    reload: () => loadCodex(true)
  }
}
