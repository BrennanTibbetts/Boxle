import LevelManager from './LevelManager'
import CameraManager from './CameraManager'
import Display from './Display'

export default function Game() {
    return (
        <group>
            <Display />
            <LevelManager />
            <CameraManager />
        </group>
    )
}
