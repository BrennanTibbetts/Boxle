import { useControls, folder } from 'leva'
import Level from './components/Level'
import InstancedLevel from './components/InstancedLevel'
import { useBoardLayout, boardZPositions } from './hooks/useBoardLayout'
import useGame, { Phase } from './stores/useGame'
import useIntro from './stores/useIntro'

export default function LevelManager() {
    const currentLevel = useGame((state) => state.currentLevel)
    const configs = useGame((state) => state.levelConfigs)
    const phase = useGame((state) => state.phase)
    const sessionBoards = useIntro((state) => state.sessionBoards)
    const upcomingBoards = useIntro((state) => state.upcomingBoards)
    const layout = useBoardLayout()

    // How many boards to render below (already played) and above (the upcoming
    // lookahead ghosts) the current one. During play we only need a small peek
    // at the neighbours — not the whole ladder — so this defaults to one each
    // way. (The intro phase above still frames the full session.) Tunable live
    // for feel-vs-perf; the above-window is capped by how many boards the
    // providers keep generated ahead (PLAY_LOOKAHEAD).
    const { below, above, introFullDetail } = useControls('Level', {
        ladder: folder({
            below: { value: 1, min: 0, max: 8, step: 1, label: 'preview below' },
            above: { value: 1, min: 0, max: 8, step: 1, label: 'preview above' },
            // LOD: how many front boards in the intro ladder render full detail;
            // every board past this renders instanced (see InstancedLevel).
            introFullDetail: { value: 1, min: 1, max: 6, step: 1, label: 'intro full-detail' },
        }),
    })

    // During the board-intro the camera frames the whole session, so render
    // every board (and let them cast shadows via `interactive`). Input stays
    // blocked in READY by the phase gate in Box, so `interactive` here only
    // governs visibility/shadows.
    const intro = phase === Phase.READY

    // Daily loads every puzzle into levelConfigs up front; Library/Infinite
    // generate lazily, so they publish their pre-generated lookahead via
    // useIntro.sessionBoards. Frame whichever the active mode populated.
    if (intro) {
        const introBoards = sessionBoards.length ? sessionBoards : configs
        if (!introBoards.length) return null
        // Size-aware z for the whole ladder, so bigger boards spread out.
        const introZ = boardZPositions(introBoards.map((b) => b.levelMatrix.length), layout)
        return <>
            {introBoards.map((config, index) => (
                // LOD: the front `introFullDetail` boards render as real Box
                // components; the boards receding behind them are instanced —
                // nothing is placed during the intro, so a receding board is
                // just static colored boxes (~N draw calls instead of N², no
                // per-box React components or subscriptions).
                index < introFullDetail ? (
                    <Level
                        key={index}
                        levelIndex={index}
                        levelMatrix={config.levelMatrix}
                        interactive
                        z={introZ[index]}
                        boxSpacing={layout.boxSpacing}
                    />
                ) : (
                    <InstancedLevel
                        key={index}
                        levelMatrix={config.levelMatrix}
                        z={introZ[index]}
                        boxSpacing={layout.boxSpacing}
                    />
                )
            ))}
        </>
    }

    if (!configs.length) return null

    // PLAY: render a sliding window over the session timeline.
    //
    //   timeline = [...levelConfigs, ...upcomingBoards]
    //              └─ already played ─┘ └─ not-yet-played lookahead ghosts ─┘
    //
    // Below the current board we draw real, already-played boards (from
    // levelConfigs); above it we draw the upcoming lookahead as inert ghosts
    // (no useGame.levels entry → BLANK boxes, so they read as a preview of the
    // board layout you're about to play). The providers keep `upcomingBoards`
    // topped up in the background, so this preview survives arbitrarily deep
    // into an Infinite run — it isn't limited to the initial intro lookahead.
    //
    // levelConfigs is always a prefix of the timeline, so a ghost's z matches
    // where that board lands once advanced into play, and the prefix positions
    // agree with CameraManager (which pans using levelConfigs alone).
    const timeline = upcomingBoards.length ? [...configs, ...upcomingBoards] : configs
    const timelineZ = boardZPositions(timeline.map((b) => b.levelMatrix.length), layout)

    const currentIndex = currentLevel - 1
    const start = Math.max(0, currentIndex - below)
    const end = Math.min(timeline.length - 1, currentIndex + above)

    const levels = []
    for (let index = start; index <= end; index++) {
        const config = timeline[index]
        if (!config) continue
        // Upcoming ghosts have no useGame.levels entry — they're static
        // previews, so they render instanced. Played boards below keep real
        // Box components: their locks/boxles show mark and glow meshes.
        levels.push(
            index > currentIndex ? (
                <InstancedLevel
                    key={index}
                    levelMatrix={config.levelMatrix}
                    z={timelineZ[index]}
                    boxSpacing={layout.boxSpacing}
                />
            ) : (
                <Level
                    key={index}
                    levelIndex={index}
                    levelMatrix={config.levelMatrix}
                    interactive={index === currentIndex}
                    z={timelineZ[index]}
                    boxSpacing={layout.boxSpacing}
                />
            )
        )
    }

    return <>{levels}</>
}
