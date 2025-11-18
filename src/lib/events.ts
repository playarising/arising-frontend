export const OPEN_MINT_MODAL_EVENT = 'arising-open-mint'
export type OpenMintModalDetail = { autoStart?: boolean }

export const dispatchOpenMintModal = (detail?: OpenMintModalDetail) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_MINT_MODAL_EVENT, { detail }))
}
