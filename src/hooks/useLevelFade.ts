import { useEffect, useRef, useState } from 'react'
import type { DecodedBoard } from '../types/puzzle'
import useGame from '../stores/useGame'

export interface FadingLevel {
    index: number
    config: DecodedBoard
}

interface FadingEntry extends FadingLevel {
    timeoutId: number
}

export function useLevelFade(): FadingLevel[] {
    const [fadingLevels, setFadingLevels] = useState<FadingEntry[]>([])
    const previousLevel = useRef<number | null>(null)

    useEffect(() => {
        const unsubscribe = useGame.subscribe(
            (state) => state.currentLevel,
            (value) => {
                const { levelConfigs } = useGame.getState()
                const prev = previousLevel.current

                if (prev !== null && value > prev && levelConfigs.length > 0) {
                    const fadingIndex = prev - 1
                    const fadingConfig = levelConfigs[fadingIndex]

                    if (fadingIndex >= 0 && fadingConfig) {
                        const timeoutId = window.setTimeout(() => {
                            setFadingLevels((current) =>
                                current.filter((item) => item.index !== fadingIndex)
                            )
                        }, 1000)
                        setFadingLevels((current) => [
                            ...current,
                            { index: fadingIndex, config: fadingConfig, timeoutId },
                        ])
                    }
                }
                previousLevel.current = value
            }
        )

        return () => {
            unsubscribe()
            setFadingLevels((current) => {
                current.forEach((item) => window.clearTimeout(item.timeoutId))
                return []
            })
        }
    }, [])

    return fadingLevels
}
