import Title from "./components/Title";
import LevelManager from "./LevelManager.jsx";
import CameraManager from "./CameraManager.jsx";
import { useEffect, useRef } from "react";
import useGame from "./stores/useGame.js";
import gsap from "gsap";

export default function Game() {

    const groupRef = useRef()

    useEffect(() => {
        const unsubscribeLevel = useGame.subscribe(
            (state) => state.level,
            (value) => {
                gsap.to(groupRef.current.position, {
                    z: 12 * (value - 1),
                    duration: 1
                })
            }
        )

        // cleanup
        return () => {
           unsubscribeLevel() 
        }

    }, [])

    return (
        <group
            ref={groupRef}
        >
            <Title />
            <LevelManager />
            <CameraManager />
        </group>
    )
}