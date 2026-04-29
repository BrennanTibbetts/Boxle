// Singleton drag tracker shared across all Box instances. Drag-marking works
// by hovering between boxes, so the state has to be global (not per-box). The
// listeners install once at module load; HMR cleans them up to avoid stacking
// across hot reloads in dev.
//
// A drag is only committed once the pointer has moved past `DRAG_THRESHOLD_PX`
// from the pointerdown position. Without this, touch-screen jitter on a tap
// would fire `pendingDragMark` immediately, marking a box that the user only
// meant to long-press.

const DRAG_THRESHOLD_PX = 6

let pendingDragMark: (() => void) | null = null
let hasDragged = false
let dragMovementX = 0
let dragMovementY = 0
let downX = 0
let downY = 0

const onPointerDown = (e: PointerEvent) => {
    dragMovementX = 0
    dragMovementY = 0
    downX = e.clientX
    downY = e.clientY
}

const onPointerMove = (e: PointerEvent) => {
    dragMovementX += e.movementX
    dragMovementY += e.movementY
    // Mouse: require primary button held. Touch: always active between
    // pointerdown and pointerup (no hover state). Pen: pressure check to
    // avoid drag-marking on hover. The first touch pointermove on iOS
    // Safari reports `buttons: 0` and `pressure: 0` before stabilising —
    // checking pointerType sidesteps that quirk so the very first box of a
    // touch drag actually gets marked.
    const isActive =
        e.pointerType === 'touch' ? true :
        e.pointerType === 'pen'   ? e.pressure > 0 || e.buttons === 1 :
        /* mouse */                 e.buttons === 1
    if (!isActive || !pendingDragMark || hasDragged) return

    const dx = e.clientX - downX
    const dy = e.clientY - downY
    if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return

    hasDragged = true
    pendingDragMark()
    pendingDragMark = null
}

const onPointerUp = () => {
    pendingDragMark = null
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
}
