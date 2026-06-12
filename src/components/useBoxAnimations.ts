import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { Group, Mesh, MeshBasicMaterial } from 'three'

import useGame, { BoxState } from '../stores/useGame'
import type { BoxStateValue } from '../stores/useGame'
import useBoxSettings from '../stores/useBoxSettings'
import { dragTracker } from '../utils/dragTracker'

// Box's animation layer, split out of the component so Box.tsx reads as
// wiring + gestures + JSX. Two hooks:
//   - useBoxStateAnimation: the boxState transition machine (mark flip, lock
//     cascade, boxle pop, undo/restart reset) plus the unmount cleanup for
//     every tween target it owns — one list, so adding a tween target can't
//     drift from its cleanup.
//   - useWrongShake: the wrong-placement flash + shake timeline.
// All tweens mutate three.js objects directly (never React state) and are
// driven under frameloop="demand" by GsapInvalidator.

// Which axis to flip around for a mark/lock, based on the drag direction the
// flip should appear to follow.
function getFlip(dx: number, dy: number) {
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    if (ax === 0 && ay === 0) return { x: Math.PI, y: 0, z: 0 }
    if (ax >= ay) return { x: 0, y: 0, z: dx > 0 ? -Math.PI : Math.PI }
    return { x: dy > 0 ? Math.PI : -Math.PI, y: 0, z: 0 }
}

export function useBoxStateAnimation({ boxRef, markRef, boxleMeshRef, glowRef, spinDirRef, boxState, levelIndex, row, col }: {
    boxRef: RefObject<Group | null>
    markRef: RefObject<Mesh | null>
    boxleMeshRef: RefObject<Mesh | null>
    glowRef: RefObject<Mesh | null>
    // Written here on boxle placement, read by Box's BoxleSpin loop.
    spinDirRef: RefObject<{ y: number; x: number }>
    boxState: BoxStateValue
    levelIndex: number
    row: number
    col: number
}): void {
    const prevStateRef = useRef<BoxStateValue>(BoxState.BLANK)

    useEffect(() => {
        const box = boxRef.current
        if (!box) return

        const prev = prevStateRef.current
        prevStateRef.current = boxState
        // This effect only re-runs when boxState changes, so prev === boxState
        // means mount. Skipping it matters: a board-intro mounts thousands of
        // BLANK boxes at once, and without this guard each one would issue
        // killTweensOf scans plus no-op reset tweens into gsap's global ticker.
        if (prev === boxState) return

        const { lockBaseDelay, lockDelayPerUnit, lockDuration, boxleScale, glowScale, markSize, lockMarkSize, markDuration } = useBoxSettings.getState()

        const alreadyFlipped = prev === BoxState.MARK || prev === BoxState.LOCK

        if (boxState === BoxState.MARK) {
            if (!alreadyFlipped) {
                const flip = getFlip(dragTracker.movementX, dragTracker.movementY)
                gsap.to(box.rotation, { ...flip, duration: markDuration })
            }
            if (markRef.current) gsap.to(markRef.current.scale, { x: markSize, z: markSize, duration: markDuration, ease: 'back.out(2)' })
        } else if (boxState === BoxState.LOCK) {
            let delay = 0
            if (!alreadyFlipped) {
                const boxlePos = useGame.getState().lastBoxlePosition
                let flip = { x: Math.PI, y: 0, z: 0 }
                if (boxlePos && boxlePos.levelIndex === levelIndex) {
                    const dx = col - boxlePos.col
                    const dy = row - boxlePos.row
                    delay = lockBaseDelay + lockDelayPerUnit * Math.sqrt(dx * dx + dy * dy)
                    flip = getFlip(dx, dy)
                }
                gsap.to(box.rotation, { ...flip, duration: lockDuration, delay })
            }
            if (markRef.current) gsap.to(markRef.current.scale, { x: lockMarkSize, z: lockMarkSize, duration: lockDuration * 0.8, delay, ease: 'back.out(2)' })
        } else if (boxState === BoxState.BLANK) {
            // Kill any in-flight or delayed tweens before resetting
            gsap.killTweensOf(box.rotation)
            if (markRef.current)       gsap.killTweensOf(markRef.current.scale)
            if (boxleMeshRef.current) gsap.killTweensOf(boxleMeshRef.current.scale)
            if (glowRef.current)       gsap.killTweensOf(glowRef.current.scale)

            const reverting = useGame.getState().isReverting

            if ((prev === BoxState.LOCK || prev === BoxState.BOXLE) && !reverting) {
                // Restart — instant reset, no animation
                box.rotation.set(0, 0, 0)
                if (markRef.current)       markRef.current.scale.set(0, 0.1, 0)
                if (boxleMeshRef.current) { boxleMeshRef.current.scale.set(1, 1, 1); boxleMeshRef.current.rotation.set(0, 0, 0) }
                if (glowRef.current)       glowRef.current.scale.set(0, 0, 0)
            } else {
                // Undo (reverse the lock cascade / boxle) or a mark toggled off —
                // animate the flip back. Reverting a BOXLE also shrinks the boxle
                // and glow and settles its spin back to rest.
                if (prev === BoxState.BOXLE) {
                    if (boxleMeshRef.current) {
                        gsap.to(boxleMeshRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.in' })
                        gsap.to(boxleMeshRef.current.rotation, { x: 0, y: 0, z: 0, duration: 0.3 })
                    }
                    if (glowRef.current) gsap.to(glowRef.current.scale, { x: 0, y: 0, z: 0, duration: 0.3, ease: 'power2.in' })
                }
                gsap.to(box.rotation, { x: 0, y: 0, z: 0, duration: markDuration })
                if (markRef.current) gsap.to(markRef.current.scale, { x: 0, z: 0, duration: markDuration * 0.75 })
            }
        } else if (boxState === BoxState.BOXLE) {
            spinDirRef.current = {
                y: Math.random() < 0.5 ? 1 : -1,
                x: (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? 1 : -1),
            }
            gsap.to(box.rotation, { x: 0, y: 0, z: 0, duration: 0.3, ease: 'back.out(1.5)' })
            if (markRef.current) gsap.to(markRef.current.scale, { x: 0, z: 0, duration: 0.15 })
            if (boxleMeshRef.current) gsap.to(boxleMeshRef.current.scale, { x: boxleScale, y: boxleScale, z: boxleScale, duration: 0.4, ease: 'back.out(1.5)' })
            if (glowRef.current)       gsap.to(glowRef.current.scale,       { x: glowScale,   y: glowScale,   z: glowScale,   duration: 0.4, ease: 'back.out(1.5)' })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boxState])

    // Unmount cleanup for this hook's tween targets, so in-flight tweens
    // don't keep mutating detached objects. Lock-cascade tweens with `delay`
    // are the most important to catch — they outlive the mount when a level
    // is restarted mid-cascade. (The hover-scale and charge tweens belong to
    // Box; the wrong-shake timeline cleans itself up in useWrongShake.)
    useEffect(() => {
        return () => {
            if (boxRef.current) gsap.killTweensOf(boxRef.current.rotation)
            if (markRef.current) gsap.killTweensOf(markRef.current.scale)
            if (boxleMeshRef.current) gsap.killTweensOf(boxleMeshRef.current.scale)
            if (glowRef.current) gsap.killTweensOf(glowRef.current.scale)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}

// Wrong-placement feedback: red flash on the overlay material + horizontal
// shake of the whole box group. The timeline's onComplete is also where the
// game-over handoff lives — phase flips to ENDED only after the shake
// finishes, so the EndScreen never cuts the animation off.
export function useWrongShake(
    boxRef: RefObject<Group | null>,
    wrongMaterial: MeshBasicMaterial,
    isWrongPlacement: boolean,
): void {
    useEffect(() => {
        const box = boxRef.current
        if (!isWrongPlacement || !box) return

        const baseX = box.position.x

        const tl = gsap.timeline({
            onComplete: () => {
                useGame.getState().clearWrongPlacement()
                if (useGame.getState().lives === 0) useGame.getState().end()
            },
        })

        // Red flash — peaks fast, lingers as it fades
        tl.to(wrongMaterial, { opacity: 0.7, duration: 0.05, ease: 'none' })
        tl.to(wrongMaterial, { opacity: 0,   duration: 0.4,  ease: 'power2.out' })

        // Shake — runs in parallel with the flash
        tl.to(box.position, { x: baseX + 0.22, duration: 0.05, ease: 'none'   }, 0)
        tl.to(box.position, { x: baseX - 0.18, duration: 0.07, ease: 'none'   }, 0.05)
        tl.to(box.position, { x: baseX + 0.13, duration: 0.07, ease: 'none'   }, 0.12)
        tl.to(box.position, { x: baseX - 0.08, duration: 0.06, ease: 'none'   }, 0.19)
        tl.to(box.position, { x: baseX + 0.03, duration: 0.05, ease: 'none'   }, 0.25)
        tl.to(box.position, { x: baseX,        duration: 0.05, ease: 'power1.out' }, 0.30)

        return () => { tl.kill() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWrongPlacement])
}
