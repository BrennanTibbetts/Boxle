import { useEffect, useRef, useState } from 'react'
import { XStack, YStack } from 'tamagui'
import useGame, { Phase, GameMode, deriveSessionOutcome } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useInfiniteRun from '../stores/useInfiniteRun'
import useUpsell from '../stores/useUpsell'
import useGeneration from '../stores/useGeneration'
import StatsModal from './StatsModal'
import { BoxleIcon, MarkIcon, EmptyBoxIcon } from './BoxIcons'
import { buildShareGrid, formatTime, shareOrCopy } from '../utils/share'
import { todayISO } from '../utils/date'
import {
    BodyText,
    GlassCard,
    HudButton,
    ModalOverlay,
    ModalTitle,
    StatValue,
    SubLabel,
} from './ui'

function StatBlock({ label, value }: { label: string; value: string | number }) {
    return (
        <YStack alignItems="center" gap="$1">
            <SubLabel>{label}</SubLabel>
            <StatValue>{value}</StatValue>
        </YStack>
    )
}

// Row of per-level completion icons. (Named CompletionRow, not LevelGrid —
// that name collides with the unrelated `LevelGrid` board type in types/game.)
export function CompletionRow({
    levelsCompleted,
    levelCount,
    isComplete,
}: {
    levelsCompleted: number
    levelCount: number
    isComplete: boolean
}) {
    return (
        <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            {Array.from({ length: levelCount }, (_, i) => {
                if (i < levelsCompleted) return <BoxleIcon key={i} size={26} />
                if (i === levelsCompleted && !isComplete) return <MarkIcon key={i} size={26} />
                return <EmptyBoxIcon key={i} size={26} />
            })}
        </XStack>
    )
}

function DailyEndContent() {
    const lives = useGame((state) => state.lives)
    const currentLevel = useGame((state) => state.currentLevel)
    const levelCount = useGame((state) => state.levelConfigs.length)
    const startTime = useGame((state) => state.startTime)
    const endTime = useGame((state) => state.endTime)
    const restart = useGame((state) => state.restart)
    const setMode = useGame((state) => state.setMode)
    const sessionHints = useGame((state) => state.sessionHints)
    const sessionLivesLost = useGame((state) => state.sessionLivesLost)
    const levelMistakes = useGame((state) => state.levelMistakes)
    const currentStreak = usePersistence((state) => state.stats.daily.currentStreak)

    const [shareLabel, setShareLabel] = useState('Share')
    const [showStats, setShowStats] = useState(false)
    // Cleared on unmount so the label reset can't setState after the screen closes
    const shareResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => () => { if (shareResetTimer.current) clearTimeout(shareResetTimer.current) }, [])

    const { isComplete, elapsedMs: elapsed, levelsCompleted } = deriveSessionOutcome({
        lives, startTime, endTime, currentLevel, levelCount,
    })

    const shareGrid = buildShareGrid(levelMistakes, levelsCompleted, levelCount, isComplete)
    const dateStr = todayISO()
    const shareText = [
        `Boxle ${dateStr}${isComplete && elapsed ? ` · ${formatTime(elapsed)}` : ''}`,
        shareGrid,
        currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '',
    ].filter(Boolean).join('\n')

    const handleShare = async () => {
        const result = await shareOrCopy(shareText)
        if (result === 'copied') {
            setShareLabel('Copied!')
            if (shareResetTimer.current) clearTimeout(shareResetTimer.current)
            shareResetTimer.current = setTimeout(() => setShareLabel('Share'), 2000)
        }
    }

    return (
        <>
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
            <GlassCard size="lg" minWidth={280} $sm={{ maxWidth: '90%' }}>
                <ModalTitle>{isComplete ? 'Puzzle Complete' : 'Game Over'}</ModalTitle>

                <CompletionRow
                    levelsCompleted={levelsCompleted}
                    levelCount={levelCount}
                    isComplete={isComplete}
                />

                <XStack gap="$9" flexWrap="wrap" justifyContent="center">
                    <StatBlock label="Levels" value={`${levelsCompleted} / ${levelCount}`} />
                    {isComplete && elapsed !== null && (
                        <StatBlock label="Time" value={formatTime(elapsed)} />
                    )}
                    {sessionHints > 0 && (
                        <StatBlock label="Hints" value={sessionHints} />
                    )}
                    {sessionLivesLost > 0 && (
                        <StatBlock label="Mistakes" value={sessionLivesLost} />
                    )}
                </XStack>

                {currentStreak > 0 && (
                    <BodyText tone="muted">🔥 {currentStreak} day streak</BodyText>
                )}

                <XStack gap="$5" flexWrap="wrap" justifyContent="center" alignItems="center">
                    <HudButton onPress={handleShare} size="lg">
                        <HudButton.Text>{shareLabel}</HudButton.Text>
                    </HudButton>
                    <HudButton onPress={() => setShowStats(true)} size="lg">
                        <HudButton.Text>Stats</HudButton.Text>
                    </HudButton>
                    <HudButton onPress={() => setMode(GameMode.MENU)} size="lg">
                        <HudButton.Text>Menu</HudButton.Text>
                    </HudButton>
                    {isComplete ? (
                        <SubLabel>See you tomorrow!</SubLabel>
                    ) : (
                        <HudButton onPress={restart} size="lg">
                            <HudButton.Text>Try Again</HudButton.Text>
                        </HudButton>
                    )}
                </XStack>
            </GlassCard>
        </>
    )
}

function InfiniteEndContent() {
    const setMode = useGame((state) => state.setMode)
    const startTime = useGame((state) => state.startTime)
    const endTime = useGame((state) => state.endTime)
    const startNewRun = useInfiniteRun((s) => s.startNewRun)
    const currentSize = useInfiniteRun((s) => s.currentSize)
    const puzzlesCompleted = useInfiniteRun((s) => s.puzzlesCompleted)
    const runHintsUsed = useInfiniteRun((s) => s.runHintsUsed)
    const runLivesLost = useInfiniteRun((s) => s.runLivesLost)

    const elapsed = startTime && endTime ? endTime - startTime : null

    return (
        <GlassCard size="lg" minWidth={280} $sm={{ maxWidth: '90%' }}>
            <ModalTitle>Run Ended</ModalTitle>

            <XStack gap="$9" flexWrap="wrap" justifyContent="center">
                <StatBlock label="Deepest" value={`${currentSize}×${currentSize}`} />
                <StatBlock label="Puzzles" value={puzzlesCompleted} />
                {elapsed !== null && <StatBlock label="Time" value={formatTime(elapsed)} />}
                {runHintsUsed > 0 && <StatBlock label="Hints" value={runHintsUsed} />}
                {runLivesLost > 0 && <StatBlock label="Mistakes" value={runLivesLost} />}
            </XStack>

            <XStack gap="$5" flexWrap="wrap" justifyContent="center">
                <HudButton onPress={() => startNewRun()} size="lg">
                    <HudButton.Text>New Run</HudButton.Text>
                </HudButton>
                <HudButton onPress={() => setMode(GameMode.MENU)} size="lg">
                    <HudButton.Text>Menu</HudButton.Text>
                </HudButton>
            </XStack>
        </GlassCard>
    )
}

export default function EndScreen() {
    const phase = useGame((state) => state.phase)
    const activeMode = useGame((state) => state.activeMode)
    const upsellOpen = useUpsell((s) => s.open)
    const generating = useGeneration((s) => s.pending)

    if (phase !== Phase.ENDED) return null
    // Suppress while the upsell modal is up — Infinite gate-fail leaves the
    // game in ENDED but defers run-end until the player dismisses. EndScreen
    // appears after dismiss without an extra phase transition.
    if (upsellOpen) return null
    // Suppress while a between-puzzle generation is in flight — the
    // worker-backed advance leaves the game in ENDED for a beat before
    // flipping back to PLAYING. Without this, the EndScreen would flash
    // every level transition in Infinite/Library.
    if (generating) return null

    return (
        <ModalOverlay layer="game" intensity="light">
            {activeMode === GameMode.INFINITE ? <InfiniteEndContent /> : <DailyEndContent />}
        </ModalOverlay>
    )
}
