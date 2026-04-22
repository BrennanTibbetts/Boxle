import TimerDisplay from '../components/TimerDisplay'
import ControlsManager from './ControlsManager'
import HUD from './HUD'

export default function Interface() {
    return (
        <div className='interface'>
            <HUD />
            <TimerDisplay />
            <ControlsManager />
        </div>
    )
}
