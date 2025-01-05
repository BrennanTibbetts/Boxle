import LivesDisplay from './LivesDisplay'
import ControlsManager from './ControlsManager'
import TimerDisplay from './TimerDisplay'

const Interface = () => 
    <div className="interface">
        <LivesDisplay/>
        <TimerDisplay/>
        <ControlsManager/>
    </div>
export default Interface