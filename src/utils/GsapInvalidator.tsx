import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'

// frameloop="demand" bridge: R3F only renders when something calls
// invalidate(). React commits inside the Canvas auto-invalidate, and useFrame
// loops chain their own invalidations — but GSAP tweens mutate three.js
// objects entirely outside React (box flips, camera pans, material fades), so
// nothing would request the frames they need. While any tween or timeline is
// live on the global timeline, every gsap tick requests a frame; once the
// last tween completes the ticker check goes quiet and rendering stops.
export default function GsapInvalidator() {
    const invalidate = useThree((s) => s.invalidate)
    useEffect(() => {
        const tick = () => {
            if (gsap.globalTimeline.getChildren(true, true, true).length > 0) invalidate()
        }
        gsap.ticker.add(tick)
        return () => { gsap.ticker.remove(tick) }
    }, [invalidate])
    return null
}
