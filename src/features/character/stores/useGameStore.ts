import { create } from 'zustand'
import { Connection, PublicKey } from '@solana/web3.js'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export type InventoryItem = {
    resource: string
    displayName: string
    mint: string
    amount: number
}

type GameStore = {
    inventory: InventoryItem[]
    setInventory: (inventory: InventoryItem[]) => void
    refreshInventory: (
        connection: Connection,
        publicKey: PublicKey,
        resourceMintMap: Map<string, { resource: string; displayName: string; mint: string }>
    ) => Promise<void>
}

export const useGameStore = create<GameStore>((set) => ({
    inventory: [],
    setInventory: (inventory) => set({ inventory }),
    refreshInventory: async (connection, publicKey, resourceMintMap) => {
        try {
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
    }
}))
