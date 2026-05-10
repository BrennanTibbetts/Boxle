import { create } from 'zustand'

// Tracks whether a puzzle generation is in flight on the worker, so the UI
// can show a delayed spinner / suppress the EndScreen until the next puzzle
// is ready. Mode providers set this around their `takeOrGenerate` awaits.
//
// Single-flag rather than per-namespace because only one mode provider is
// mounted at a time (see Interface.tsx) — concurrent generations across
// namespaces don't happen in practice.

interface GenerationState {
    pending: boolean
    setPending: (v: boolean) => void
}

const useGeneration = create<GenerationState>((set) => ({
    pending: false,
    setPending: (v) => set({ pending: v }),
}))

export default useGeneration
