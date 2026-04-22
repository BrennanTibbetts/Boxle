import { useEffect, useState } from 'react'

export default function useCtrlKey() {
    const [held, setHeld] = useState(false)
    useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === 'Control') setHeld(true) }
        const up = (e: KeyboardEvent) => { if (e.key === 'Control') setHeld(false) }
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [])
    return held
}
