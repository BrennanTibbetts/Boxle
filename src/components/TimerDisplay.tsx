import { useEffect, useRef, useState } from 'react'
import { Phase } from '../types/game'
import useGame from '../stores/useGame'

export default function TimerDisplay() {
    const [elapsed, setElapsed] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        const unsubscribe = useGame.subscribe(
            (state) => state.phase,
            (phase) => {
                if (intervalRef.current) clearInterval(intervalRef.current)

                if (phase === Phase.PLAYING) {
                    const start = Date.now()
                    intervalRef.current = setInterval(() => {
                        setElapsed(Math.floor((Date.now() - start) / 1000))
                    }, 1000)
                }
            },
            { fireImmediately: true }
        )
        return () => {
            unsubscribe()
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const seconds = (elapsed % 60).toString().padStart(2, '0')

    return (
        <div className="timer">
            {minutes}:{seconds}
        </div>
    )
}
