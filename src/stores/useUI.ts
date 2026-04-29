import { create } from 'zustand'

interface UIState {
    rulesOpen: boolean
    setRulesOpen: (v: boolean) => void
    authOpen: boolean
    setAuthOpen: (v: boolean) => void
}

export default create<UIState>((set) => ({
    rulesOpen: false,
    setRulesOpen: (v) => set({ rulesOpen: v }),
    authOpen: false,
    setAuthOpen: (v) => set({ authOpen: v }),
}))
