import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import { KeyboardControls } from '@react-three/drei'
import Interface from './Interface.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <KeyboardControls
        map={[
        ]}
    >
        <Canvas
            className='r3f'
            shadows
            // orthographic
            camera={ {
                fov: 45,
                near: 0.1,
                // zoom: 100,
                far: 29,
                position: [ 0, 16, 0]
            } }
        >
            <Experience />
        </Canvas>
        <Interface/>
    </KeyboardControls>
)