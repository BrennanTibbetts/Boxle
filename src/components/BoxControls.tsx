import { useRef } from 'react'
import { useControls } from 'leva'
import { useResource } from '../stores/useResource'
import useBoxSettings from '../stores/useBoxSettings'

export default function BoxControls() {
    const glowOpacityRef = useRef(0.78)
    const glowColorMixRef = useRef(1.0)

    const set = useBoxSettings.getState().set
    const res = useResource.getState

    useControls('Mark', {
        markSize:     { value: 0.35, min: 0.05, max: 0.9,  step: 0.01, label: 'Mark Dot Size',      onChange: (v) => set({ markSize: v }) },
        lockMarkSize: { value: 0.65, min: 0.05, max: 0.9,  step: 0.01, label: 'Lock Dot Size',      onChange: (v) => set({ lockMarkSize: v }) },
        markDuration: { value: 0.2,  min: 0.05, max: 1.0,  step: 0.05, label: 'Mark Anim Duration', onChange: (v) => set({ markDuration: v }) },
    })

    useControls('Lock Cascade', {
        lockBaseDelay:    { value: 0.0,  min: 0.0,  max: 0.5, step: 0.01,  label: 'Base Delay',        onChange: (v) => set({ lockBaseDelay: v }) },
        lockDelayPerUnit: { value: 0.05, min: 0.0,  max: 0.3, step: 0.005, label: 'Delay Per Distance', onChange: (v) => set({ lockDelayPerUnit: v }) },
        lockDuration:     { value: 0.25, min: 0.05, max: 1.0, step: 0.05,  label: 'Lock Duration',      onChange: (v) => set({ lockDuration: v }) },
    })

    useControls('Hint', {
        hintDimOpacity: { value: 0.72, min: 0.0, max: 1.0, step: 0.01, label: 'Dim Opacity', onChange: (v) => set({ hintDimOpacity: v }) },
    })

    useControls('Star Box', {
        enableSpin:            { value: true, label: 'Spin',                  onChange: (v) => set({ enableSpin: v }) },
        starSpinSpeed:         { value: 1.2,  min: 0,   max: 10,  step: 0.1,  label: 'Spin Speed',         onChange: (v) => set({ starSpinSpeed: v }) },
        starEmissiveIntensity: { value: 3.8,  min: 0,   max: 10,  step: 0.1,  label: 'Emissive Intensity', onChange: (v) => res().updateStarMaterials(v) },
        starBoxScale:          { value: 0.53, min: 0.1, max: 1.5, step: 0.01, label: 'Box Scale',          onChange: (v) => set({ starBoxScale: v }) },
        glowScale:             { value: 1.30, min: 1.0, max: 4.0, step: 0.05, label: 'Fake Glow Size',     onChange: (v) => set({ glowScale: v }) },
        glowOpacity:           { value: 0.78, min: 0,   max: 1,   step: 0.01, label: 'Fake Glow Opacity',  onChange: (v) => { glowOpacityRef.current = v; res().updateGlowMaterials(v, glowColorMixRef.current) } },
        glowColorMix:          { value: 1.0,  min: 0,   max: 1,   step: 0.01, label: 'Glow Color Mix',     onChange: (v) => { glowColorMixRef.current = v; res().updateGlowMaterials(glowOpacityRef.current, v) } },
    })

    return null
}
