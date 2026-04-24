import { create } from 'zustand'

interface UIState {
    rulesOpen: boolean
    setRulesOpen: (v: boolean) => void
}

export default create<UIState>((set) => ({
    rulesOpen: false,
    setRulesOpen: (v) => set({ rulesOpen: v }),
}))
