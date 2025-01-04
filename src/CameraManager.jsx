import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import useGame from "./stores/useGame";
import { useControls } from "leva";

export default function CameraManager() {

    const props = useControls("Camera", {
        levelHeightIncrease: 1      
    })

    const targetPosition = useRef({ x: 0, y: 16, z: 0 });

    useEffect(() => {
        const unsubscribeSetPosition= useGame.subscribe(
            (state) => state.cameraPosition,
            (value) => {
                targetPosition.current = value
            }
        );

        const unsubscribeLevel = useGame.subscribe(
            (state) => state.level,
            (value) => {
                targetPosition.current.y = targetPosition.current.y + (value-1) * props.levelHeightIncrease
                console.log(targetPosition.current)
            }
        );

        return () => {
            unsubscribeSetPosition()
            unsubscribeLevel()
        };
    }, []);

    useFrame((state) => {
        gsap.to(state.camera.position, {
            x: targetPosition.current.x,
            y: targetPosition.current.y,
            z: targetPosition.current.z,
            duration: 1
        });
    });

    return null;
}