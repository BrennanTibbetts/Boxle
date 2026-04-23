import TimerDisplay from '../components/TimerDisplay'
import ControlsManager from './ControlsManager'
import HUD from './HUD'
import EndScreen from './EndScreen'
import { usePersistenceSync } from '../hooks/usePersistenceSync'

export default function Interface() {
    usePersistenceSync()

    return (
        <div className='interface'>
            <HUD />
            <TimerDisplay />
            <ControlsManager />
            <EndScreen />
        </div>
    )
}
