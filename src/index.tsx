import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'

import Experience from './Experience'
import Interface from './interface/Interface'
import ResourceLoader from './utils/ResourceLoader'

import './style.css'

const root = ReactDOM.createRoot(document.querySelector('#root')!)

root.render(
    <KeyboardControls map={[]}>
        <Canvas
            className='r3f'
            shadows
            camera={{ fov: 45, near: 0.1, far: 100, position: [0, 60, 0] }}
        >
            <ResourceLoader>
                <Experience />
            </ResourceLoader>
        </Canvas>
        <Leva collapsed theme={{ sizes: { rootWidth: '380px' } }} />
        <Interface />
    </KeyboardControls>
)
