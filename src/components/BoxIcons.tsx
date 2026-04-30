import { useMemo } from 'react'
import { COLORS } from '../stores/useResource'

interface IconProps {
    size?: number
}

// Match the real game: a rounded region-colored box with a rounded inner shape.
// Inner shape tells you the state: small dark (mark), larger dark (lock), bright (boxle).
const DARK_INNER = '#1a1a1c'
const BRIGHT_INNER = '#fffbe0'

// 'lightyellow' is too close to the cream boxle inner — skip it for BoxleIcon.
const BOXLE_POOL = COLORS.filter(c => c !== 'lightyellow')

function pickFrom(pool: string[]): string {
    return pool[Math.floor(Math.random() * pool.length)]
}

export function MarkIcon({ size = 29 }: IconProps) {
    const outer = useMemo(() => pickFrom(COLORS), [])
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, verticalAlign: '-0.25em' }}>
            <rect x="2" y="2" width="20" height="20" rx="5" fill={outer} />
            <rect x="9" y="9" width="6" height="6" rx="1.4" fill={DARK_INNER} />
        </svg>
    )
}

export function LockIcon({ size = 29 }: IconProps) {
    const outer = useMemo(() => pickFrom(COLORS), [])
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, verticalAlign: '-0.25em' }}>
            <rect x="2" y="2" width="20" height="20" rx="5" fill={outer} />
            <rect x="5.5" y="5.5" width="13" height="13" rx="2.6" fill={DARK_INNER} />
        </svg>
    )
}

export function BoxleIcon({ size = 29 }: IconProps) {
    const outer = useMemo(() => pickFrom(BOXLE_POOL), [])
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, verticalAlign: '-0.25em' }}>
            <rect x="2" y="2" width="20" height="20" rx="5" fill={outer} />
            <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" fill={BRIGHT_INNER} />
        </svg>
    )
}
