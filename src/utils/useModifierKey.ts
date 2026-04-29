import { useEffect, useState } from 'react'

export default function useModifierKey(key: string): boolean {
    const [held, setHeld] = useState(false)
    useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === key) setHeld(true) }
        const up = (e: KeyboardEvent) => { if (e.key === key) setHeld(false) }
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [key])
    return held
}
