import { useRef } from 'react'
import gsap from 'gsap'
import type { MutableRefObject } from 'react'
import type { Group } from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface ButtonAnimation {
    ref: MutableRefObject<Group | null>
    enter: (e: ThreeEvent<PointerEvent>) => void
    leave: (e: ThreeEvent<PointerEvent>) => void
}

export default function useButtonAnimation(): ButtonAnimation {
    const ref = useRef<Group>(null)

    const enter = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        // overwrite: rapid hover in/out otherwise stacks contending tweens on
        // the same scale target (gsap's default is overwrite: false)
        if (ref.current) gsap.to(ref.current.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.5, overwrite: 'auto' })
    }

    const leave = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (ref.current) gsap.to(ref.current.scale, { x: 1, y: 1, z: 1, duration: 0.5, overwrite: 'auto' })
    }

    return { ref, enter, leave }
}
