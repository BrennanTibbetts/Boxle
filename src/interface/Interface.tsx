import TimerDisplay from '../components/TimerDisplay'
import ControlsManager from './ControlsManager'

export default function Interface() {
    return (
        <div className='interface'>
            <TimerDisplay />
            <ControlsManager />
        </div>
    )
}
