import TimerDisplay from '../components/TimerDisplay'
import ControlsManager from './ControlsManager'
import HUD from './HUD'
import HintDescription from './HintDescription'
import EndScreen from './EndScreen'
import { DailyModeProvider } from '../modes/DailyModeProvider'

export default function Interface() {
    return (
        <div className='interface'>
            <DailyModeProvider />
            <HUD />
            <TimerDisplay />
            <EndScreen />
            <HintDescription />
            <ControlsManager />
        </div>
    )
}
