// Singleton drag tracker shared across all Box instances. Drag-marking works
// by hovering between boxes, so the state has to be global (not per-box).
//
// Drag-start detection runs through `maybeStartDrag` (called from the Box's
// R3F onPointerMove and as a window-level fallback). A drag is only
// committed once the pointer has moved past `DRAG_THRESHOLD_PX` from the
// pointerdown position — without this, touch-screen jitter on a tap would
// fire `pendingDragMark` immediately and mark a box the user only meant to
// long-press.
//
// Why R3F event over window event for the primary path: on iOS Safari,
// when R3F captures the pointer at pointerdown, the very first pointermove
// for that pointer doesn't always bubble to window before R3F raycasts and
// dispatches its synthetic events. Result: the *starting* box of a touch
// drag was never seen by a window listener. R3F's per-mesh pointermove
// fires reliably on the same channel that already works for boxes 2+ via
// pointerenter, so we route through that.

const DRAG_THRESHOLD_PX = 6

let pendingDragMark: (() => void) | null = null
let hasDragged = false
let dragMovementX = 0
let dragMovementY = 0
let downX = 0
let downY = 0
// Identifies the box that received the most recent pointerdown so its
// synthetic pointerenter (which R3F fires right after pointerdown for a new
// touch contact) can be ignored. Without this, the start box gets toggled
// once by the synthetic enter and again by the pendingDragMark — net BLANK.
// Cleared when the synthetic enter is consumed and again on pointerup, so a
// later drag-back into the same box still toggles correctly.
let startBoxKey: string | null = null

const onPointerDown = (e: PointerEvent) => {
    dragMovementX = 0
    dragMovementY = 0
    downX = e.clientX
    downY = e.clientY
}

function maybeStartDrag(e: PointerEvent): void {
    if (hasDragged || !pendingDragMark) return

    // Mouse: require primary button held. Touch: always active between
    // pointerdown and pointerup (no hover state). Pen: pressure check to
    // avoid drag-marking on hover.
    const isActive =
        e.pointerType === 'touch' ? true :
        e.pointerType === 'pen'   ? e.pressure > 0 || e.buttons === 1 :
        /* mouse */                 e.buttons === 1
    if (!isActive) return

    const dx = e.clientX - downX
    const dy = e.clientY - downY
    if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return

    hasDragged = true
    pendingDragMark()
    pendingDragMark = null
}

const onPointerMove = (e: PointerEvent) => {
    dragMovementX += e.movementX
    dragMovementY += e.movementY
    maybeStartDrag(e)
}

const onPointerUp = () => {
    pendingDragMark = null
    startBoxKey = null
}

window.addEventListener('pointerdown', onPointerDown)
window.addEventListener('pointermove', onPointerMove)
window.addEventListener('pointerup', onPointerUp)

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        window.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
    })
}

export const dragTracker = {
    get hasDragged(): boolean { return hasDragged },
    get movementX(): number { return dragMovementX },
    get movementY(): number { return dragMovementY },
    setHasDragged(value: boolean): void { hasDragged = value },
    setPendingDragMark(fn: (() => void) | null): void { pendingDragMark = fn },
    // Seed the down position from the R3F pointerdown event. We can't trust
    // the window-level pointerdown to have fired by the time the Box handler
    // runs (and on iOS Safari, with R3F pointer-capture, it may not fire at
    // all for the in-canvas pointer). Without an authoritative down position,
    // the threshold check in maybeStartDrag would compare against stale
    // coordinates from a previous interaction.
    setDownPosition(x: number, y: number): void {
        downX = x
        downY = y
        dragMovementX = 0
        dragMovementY = 0
    },
    setStartBox(key: string | null): void { startBoxKey = key },
    consumeStartBox(key: string): boolean {
        if (startBoxKey !== key) return false
        startBoxKey = null
        return true
    },
    maybeStartDrag,
}
