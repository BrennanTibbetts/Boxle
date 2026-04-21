import useGame from '../stores/useGame'

export default function ControlsManager() {
    const restart = useGame((state) => state.restart)

    return (
        <div className='controls'>
            <button onClick={restart}>Restart</button>
        </div>
    )
}
