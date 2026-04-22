import { create } from 'zustand'

interface BoxSettingsState {
    // Lock Cascade
    lockBaseDelay: number
    lockDelayPerUnit: number
    lockDuration: number
    // Mark dot sizes
    markSize: number
    lockMarkSize: number
    markDuration: number
    // Star Box
    enableSpin: boolean
    starSpinSpeed: number
    starBoxScale: number
    glowScale: number
    // Hints
    hintDimOpacity: number
    set: (partial: Partial<Omit<BoxSettingsState, 'set'>>) => void
}

const useBoxSettings = create<BoxSettingsState>()((set) => ({
    markSize: 0.35,
    lockMarkSize: 0.65,
    markDuration: 0.2,
    lockBaseDelay: 0.0,
    lockDelayPerUnit: 0.05,
    lockDuration: 0.25,
    enableSpin: true,
    starSpinSpeed: 1.2,
    starBoxScale: 0.53,
    glowScale: 1.30,
    hintDimOpacity: 0.72,
    set: (partial) => set(partial),
}))

export default useBoxSettings
