import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import usePersistence from '../stores/usePersistence'
import Modal from './Modal'
import { formatTime } from '../utils/share'
import {
    HudButton,
    HudLabel,
    ModalTitle,
    StatValue,
    SubLabel,
} from './ui'

type StatsTab = 'daily' | 'arcade' | 'library'

function StatItem({ value, label }: { value: string | number; label: string }) {
    return (
        <YStack alignItems="center" gap="$1">
            <StatValue>{value}</StatValue>
            <SubLabel>{label}</SubLabel>
        </YStack>
    )
}

function Section({ children }: { children: React.ReactNode }) {
    return (
        <YStack
            width="100%"
            borderTopWidth={1}
            borderTopColor="$borderSubtle"
            paddingVertical="$6"
            alignItems="center"
        >
            {children}
        </YStack>
    )
}

function StatsRow({ children }: { children: React.ReactNode }) {
    return (
        <XStack justifyContent="center" gap="$9" flexWrap="wrap">
            {children}
        </XStack>
    )
}

function DailyStats() {
    const daily = usePersistence((s) => s.stats.daily)
    const winRate = daily.sessionsPlayed > 0
        ? Math.round((daily.sessionsCompleted / daily.sessionsPlayed) * 100)
        : 0

    return (
        <>
            <Section>
                <StatsRow>
                    <StatItem
                        value={daily.currentStreak > 0 ? `🔥 ${daily.currentStreak}` : daily.currentStreak}
                        label="Streak"
                    />
                    <StatItem value={daily.longestStreak} label="Best Streak" />
                </StatsRow>
            </Section>
            <Section>
                <StatsRow>
                    <StatItem value={daily.sessionsPlayed} label="Played" />
                    <StatItem value={daily.sessionsCompleted} label="Completed" />
                    <StatItem value={`${winRate}%`} label="Win Rate" />
                </StatsRow>
            </Section>
            <Section>
                <StatsRow>
                    {daily.bestTimeMs !== null && (
                        <StatItem value={formatTime(daily.bestTimeMs)} label="Best Time" />
                    )}
                    <StatItem value={daily.hintsUsed} label="Hints" />
                    <StatItem value={daily.livesLost} label="Mistakes" />
                </StatsRow>
            </Section>
        </>
    )
}

function ArcadeStats() {
    const arcade = usePersistence((s) => s.stats.arcade)
    return (
        <>
            <Section>
                <StatsRow>
                    <StatItem
                        value={arcade.deepestSizeEver > 0 ? `${arcade.deepestSizeEver}×${arcade.deepestSizeEver}` : '—'}
                        label="Deepest"
                    />
                </StatsRow>
            </Section>
            <Section>
                <StatsRow>
                    <StatItem value={arcade.runsPlayed} label="Runs" />
                </StatsRow>
            </Section>
            <Section>
                <StatsRow>
                    <StatItem value={arcade.hintsUsed} label="Hints" />
                    <StatItem value={arcade.livesLost} label="Mistakes" />
                </StatsRow>
            </Section>
        </>
    )
}

function LibraryStats() {
    const library = usePersistence((s) => s.stats.library)
    const sizes = Object.keys(library.tierCompletions).map(Number).sort((a, b) => a - b)
    const totalCompleted = sizes.reduce((sum, s) => sum + (library.tierCompletions[s] ?? 0), 0)

    return (
        <>
            <Section>
                <StatsRow>
                    <StatItem value={totalCompleted} label="Total Completed" />
                </StatsRow>
            </Section>
            {sizes.length > 0 && (
                <Section>
                    <XStack
                        gap="$3"
                        flexWrap="wrap"
                        justifyContent="center"
                        width="100%"
                    >
                        {sizes.map((size) => (
                            <YStack key={size} alignItems="center" gap="$1" minWidth={70}>
                                <HudLabel>{size}×{size}</HudLabel>
                                <StatValue>{library.tierCompletions[size]}</StatValue>
                            </YStack>
                        ))}
                    </XStack>
                </Section>
            )}
            <Section>
                <StatsRow>
                    <StatItem value={library.hintsUsed} label="Hints" />
                    <StatItem value={library.livesLost} label="Mistakes" />
                </StatsRow>
            </Section>
        </>
    )
}

export default function StatsModal({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<StatsTab>('daily')

    return (
        <Modal
            onClose={onClose}
            overlayProps={{ intensity: 'heavy', layer: 'stats' }}
            cardProps={{
                tone: 'strongest',
                minWidth: 300,
                maxWidth: 480,
                $sm: { maxWidth: '92%', maxHeight: '90%', overflow: 'scroll' },
            }}
        >
            <ModalTitle>Stats</ModalTitle>

            <XStack gap="$1" marginBottom="$1">
                <HudButton
                    onPress={() => setTab('daily')}
                    tone={tab === 'daily' ? 'statTabActive' : 'statTab'}
                    size="sm"
                >
                    <HudButton.Text tone={tab === 'daily' ? 'bright' : 'muted'} size="sm">
                        Daily
                    </HudButton.Text>
                </HudButton>
                <HudButton
                    onPress={() => setTab('arcade')}
                    tone={tab === 'arcade' ? 'statTabActive' : 'statTab'}
                    size="sm"
                >
                    <HudButton.Text tone={tab === 'arcade' ? 'bright' : 'muted'} size="sm">
                        Arcade
                    </HudButton.Text>
                </HudButton>
                <HudButton
                    onPress={() => setTab('library')}
                    tone={tab === 'library' ? 'statTabActive' : 'statTab'}
                    size="sm"
                >
                    <HudButton.Text tone={tab === 'library' ? 'bright' : 'muted'} size="sm">
                        Library
                    </HudButton.Text>
                </HudButton>
            </XStack>

            {tab === 'daily' && <DailyStats />}
            {tab === 'arcade' && <ArcadeStats />}
            {tab === 'library' && <LibraryStats />}

            <HudButton onPress={onClose} size="lg">
                <HudButton.Text>Close</HudButton.Text>
            </HudButton>
        </Modal>
    )
}
