import { useEffect, useState } from 'react'

// Exported for the one-shot boot snapshots (Canvas props in index.tsx, shadow
// map size in Lights) — those can't react to changes anyway, but the
// breakpoint itself must be one value everywhere.
export const MOBILE_QUERY = '(max-width: 768px)'

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
    )

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_QUERY)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    return isMobile
}
