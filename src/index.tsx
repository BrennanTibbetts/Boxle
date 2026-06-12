import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import { TamaguiProvider } from 'tamagui'
import { BasicShadowMap } from 'three'

import Experience from './Experience'
import Interface from './interface/Interface'
import ResourceLoader from './utils/ResourceLoader'
import config from './tamagui.config'
import { MOBILE_QUERY } from './hooks/useIsMobile'
import { initSync } from './utils/sync'

import './style.css'

const isMobile =
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches

// Wire the persistence→Supabase push scheduling (explicit, not an import
// side effect — see initSync).
initSync()

const root = ReactDOM.createRoot(document.querySelector('#root')!)

root.render(
    <>
        <Canvas
            className='r3f'
            // Render on demand: the board is static between user actions, so
            // continuous 60fps rendering only drains battery. Frames are
            // requested by React commits (automatic), GsapInvalidator (tweens),
            // and the self-chaining useFrame loops (Display slide, IntroCamera
            // fly-in, BoxleSpin).
            frameloop='demand'
            shadows={isMobile ? { type: BasicShadowMap } : true}
            dpr={isMobile ? [1, 1.5] : [1, 2]}
            gl={{
                antialias: !isMobile,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
                alpha: false,
            }}
            camera={{ fov: 45, near: 0.1, far: 260, position: [0, 60, 0] }}
        >
            <ResourceLoader>
                <Experience />
            </ResourceLoader>
        </Canvas>
        <Leva hidden={!import.meta.env.DEV} collapsed theme={{ sizes: { rootWidth: '380px' } }} />
        <TamaguiProvider config={config} defaultTheme='dark'>
            <Interface />
        </TamaguiProvider>
    </>
)
