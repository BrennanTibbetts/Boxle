import { useEffect, useState } from 'react'
import useGeneration from '../stores/useGeneration'
import { BodyText, GlassCard, ModalOverlay } from './ui'

// Worker-backed generations resolve in one microtask on cache hits and in
// 100–800ms on cache misses (sizes 12+). Show the overlay only after a brief
// delay so the common-case hit doesn't flash a spinner.
const SPINNER_DELAY_MS = 150

export default function GenerationOverlay() {
    const pending = useGeneration((s) => s.pending)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!pending) {
            setVisible(false)
            return
        }
        const t = setTimeout(() => setVisible(true), SPINNER_DELAY_MS)
        return () => clearTimeout(t)
    }, [pending])

    if (!pending || !visible) return null

    return (
        <ModalOverlay layer="game" intensity="light">
            <GlassCard size="md">
                <BodyText tone="primary">Generating next puzzle…</BodyText>
            </GlassCard>
        </ModalOverlay>
    )
}
