// Singleton long-press tracker. Only one long-press can be in flight at a
// time, so the timer + start coords live at module scope. Movement past the
// cancel threshold or a pointerup before the timer fires aborts the press.
//
// Window-level move/up listeners install once at module load (HMR cleans up
// to avoid stacking across hot reloads in dev), so per-Box handlers can stay
// thin: they just call `start(...)` on pointerdown.

export const LONG_PRESS_MS = 350
const MOVE_CANCEL_PX = 10

interface LongPressOpts {
    onCommit: () => void
    onCancel?: () => void
}

let active: LongPressOpts | null = null
let timer: number | null = null
let startX = 0
let startY = 0

function clearTimer(): void {
    if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
    }
}

function cancel(): void {
    if (!active) return
    const a = active
    active = null
    clearTimer()
    a.onCancel?.()
}

function commit(): void {
    if (!active) return
    const a = active
    active = null
    clearTimer()
    a.onCommit()
}

const onMove = (e: PointerEvent) => {
    if (!active) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancel()
}

const onUp = () => {
    if (active) cancel()
}

window.addEventListener('pointermove', onMove)
window.addEventListener('pointerup', onUp)
window.addEventListener('pointercancel', onUp)

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        clearTimer()
        active = null
    })
}

export const longPressTracker = {
    start(e: PointerEvent, opts: LongPressOpts): void {
        cancel()
        active = opts
        startX = e.clientX
        startY = e.clientY
        timer = window.setTimeout(commit, LONG_PRESS_MS)
    },
    cancel,
}
