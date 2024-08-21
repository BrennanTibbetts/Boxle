import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import { KeyboardControls } from '@react-three/drei'
import Interface from './Interface.jsx'
import { Leva } from 'leva'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <KeyboardControls
        map={[
        ]}
    >
        <div id="instructions">
            <h1>Instructions</h1>
            <hr/>
            <img src="/exit.png" alt="exit" id="exitInstructions"/>
            <div className="content">
                <div>
                    <p>Each Column Must Have One Star</p>
                    <p>Each Row Must Have One Star</p>
                    <p>Each Region Must Have One Star</p>
                </div>
                <div>
                    <p>Stars Cannot Be Adjacent</p>
                    <p>Stars Cannot Be Diagonal</p>
                </div>
                <div>
                    <p>To Place a Star:</p>
                    Double Tap Or Right Click
                </div>
                <div>
                    <p>To Rule Out a Star:</p>
                    Tap Or Left Click
                </div>
            </div>
        </div>
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
            <Experience />
        </Canvas>
        <Leva />
        <Interface/>
    </KeyboardControls>
)