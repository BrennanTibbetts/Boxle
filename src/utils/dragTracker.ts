// Singleton drag tracker shared across all Box instances. Drag-marking works
// by hovering between boxes, so the state has to be global (not per-box). The
// listeners install once at module load; HMR cleans them up to avoid stacking
// across hot reloads in dev.

let pendingDragMark: (() => void) | null = null
let hasDragged = false
let dragMovementX = 0
let dragMovementY = 0

const onPointerDown = () => {
    dragMovementX = 0
    dragMovementY = 0
}

const onPointerMove = (e: PointerEvent) => {
    dragMovementX += e.movementX
    dragMovementY += e.movementY
    // On touch/pen, e.buttons is unreliably 0 during an active drag; use pressure instead
    const isActive = e.buttons === 1 || (e.pointerType !== 'mouse' && e.pressure > 0)
    if (isActive && pendingDragMark && !hasDragged) {
        hasDragged = true
        pendingDragMark()
        pendingDragMark = null
    }
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
