import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import { KeyboardControls } from '@react-three/drei'
import CameraManager from './CameraManager.jsx'
import Interface from './Interface.jsx'
import { Leva } from 'leva'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <KeyboardControls
        map={[
        ]}
    >
        <Canvas
            className='r3f'
            shadows
            camera={ {
                fov: 45,
                near: 0.1,
                far: 100,
                position: [ 0, 16, 0]
            } }
        >
            <CameraManager/>
            <Experience />
        </Canvas>
        <Leva />
        <Interface/>
    </KeyboardControls>
)