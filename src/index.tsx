import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'
import { TamaguiProvider } from 'tamagui'
import { BasicShadowMap } from 'three'

import Experience from './Experience'
import Interface from './interface/Interface'
import ResourceLoader from './utils/ResourceLoader'
import config from './tamagui.config'

import './style.css'

const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

const root = ReactDOM.createRoot(document.querySelector('#root')!)

root.render(
    <KeyboardControls map={[]}>
        <Canvas
            className='r3f'
            shadows={isMobile ? { type: BasicShadowMap } : true}
            dpr={isMobile ? [1, 1.5] : [1, 2]}
            gl={{
                antialias: !isMobile,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
                alpha: false,
            }}
            camera={{ fov: 45, near: 0.1, far: 100, position: [0, 60, 0] }}
        >
            <ResourceLoader>
                <Experience />
            </ResourceLoader>
        </Canvas>
        <Leva hidden={!import.meta.env.DEV} collapsed theme={{ sizes: { rootWidth: '380px' } }} />
        <TamaguiProvider config={config} defaultTheme='dark'>
            <Interface />
        </TamaguiProvider>
    </KeyboardControls>
)
