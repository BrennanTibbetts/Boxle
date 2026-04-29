export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function buildShareGrid(
    levelMistakes: readonly number[],
    levelsCompleted: number,
    levelCount: number,
    isComplete: boolean,
): string {
    return Array.from({ length: levelCount }, (_, i) => {
        if (i < levelsCompleted) return (levelMistakes[i] ?? 0) === 0 ? '🎯' : '🟡'
        if (i === levelsCompleted && !isComplete) return '💀'
        return '⬜'
    }).join('')
}

export type ShareResult = 'shared' | 'copied' | 'error'

// Prefer the native sheet on mobile (higher conversion path); fall back to
// clipboard. AbortError = user dismissed the sheet — treat as success but skip
// the copy fallback so we don't surprise them with clipboard contents.
export async function shareOrCopy(text: string): Promise<ShareResult> {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            await navigator.share({ text })
            return 'shared'
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return 'shared'
            // fall through to clipboard
        }
    }
    try {
        await navigator.clipboard.writeText(text)
        return 'copied'
    } catch {
        return 'error'
    }
}
