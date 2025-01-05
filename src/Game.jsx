import LevelManager from "./LevelManager.jsx"
import CameraManager from "./CameraManager.jsx"
import Display from "./Display.jsx"

export default function Game() {

    return (
        <group>
            <Display/>
            <LevelManager />
            <CameraManager />
        </group>
    )
}