import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'

import Experience from './Experience.jsx'
import Interface from './interface/Interface.jsx'
import ResourceLoader from './utils/ResourceLoader.jsx'

import './style.css'

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
            <ResourceLoader>
                <Experience/>
            </ResourceLoader>
        </Canvas>
        <Leva />
        <Interface/>
    </KeyboardControls>
)