import { useEffect, useRef, useState } from 'react'
import { Text, XStack } from 'tamagui'
import { Phase } from '../types/game'
import useGame from '../stores/useGame'
import { HudChip } from '../interface/ui'

export default function TimerDisplay() {
    const phase = useGame((s) => s.phase)
    const startTime = useGame((s) => s.startTime)
    const endTime = useGame((s) => s.endTime)

    const elapsedMs = (() => {
        if (!startTime) return 0
        const end = phase === Phase.ENDED && endTime ? endTime : Date.now()
        return Math.max(0, end - startTime)
    })()

    const [, forceTick] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (phase !== Phase.PLAYING || !startTime) return
        intervalRef.current = setInterval(() => forceTick((t) => t + 1), 1000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [phase, startTime])

    const elapsed = Math.floor(elapsedMs / 1000)
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const seconds = (elapsed % 60).toString().padStart(2, '0')

    return (
        <XStack
            position="absolute"
            top={16}
            left="50%"
            x="-50%"
            zIndex="$1"
            pointerEvents="none"
        >
            <HudChip paddingHorizontal="$4" paddingVertical="$1" gap={0}>
                <Text
                    fontFamily="$body"
                    fontSize="$5"
                    color="$textBody"
                    letterSpacing={1.2}
                    userSelect="none"
                >
                    {minutes}:{seconds}
                </Text>
            </HudChip>
        </XStack>
    )
}
