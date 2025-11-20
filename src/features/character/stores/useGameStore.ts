import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { type Connection, PublicKey } from '@solana/web3.js'
import { create } from 'zustand'
import { useCodexStore } from '@/stores'

export type InventoryItem = {
  resource: string
  displayName: string
  mint: string
  amount: number
}

type GameStore = {
  // Inventory state
  inventory: InventoryItem[]
  setInventory: (inventory: InventoryItem[]) => void
  refreshInventory: (connection: Connection, publicKey: PublicKey) => Promise<void>

  // Combined initialization
  initialize: (connection: Connection, publicKey: PublicKey) => Promise<void>
}

export const useGameStore = create<GameStore>((set, get) => ({
  inventory: [],

  setInventory: (inventory) => set({ inventory }),

  refreshInventory: async (connection, publicKey) => {
    try {
      // Get resource mint map from codex store
      const codexStore = useCodexStore.getState()

      // Ensure codex is loaded
      if (!codexStore.codex) {
        await codexStore.loadCodex()
      }

      const resourceMintMap = codexStore.resourceMintMap

      const response = await connection.getTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID
      })

      const newInventory: InventoryItem[] = []

      for (const acc of response.value) {
        try {
          const decoded = AccountLayout.decode(acc.account.data)
          const mintB58 = new PublicKey(decoded.mint).toBase58()
          const meta = resourceMintMap.get(mintB58)
          if (!meta) continue

          const amount = Number(BigInt(decoded.amount.toString()))
          if (amount > 0) {
            newInventory.push({
              resource: meta.resource,
              displayName: meta.displayName,
              mint: meta.mint,
              amount
            })
          }
        } catch (e) {
          console.error('Error decoding account', e)
        }
      }

      set({ inventory: newInventory })
    } catch (error) {
      console.error('Failed to refresh inventory:', error)
    }
  },

  initialize: async (connection, publicKey) => {
    const { refreshInventory } = get()
    const codexStore = useCodexStore.getState()

    try {
      // Load codex first (will use cache if available), then inventory
      await codexStore.loadCodex()
      await refreshInventory(connection, publicKey)
    } catch (error) {
      console.error('Failed to initialize game store:', error)
    }
  }
}))
