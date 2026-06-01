import { useControls, folder } from 'leva'

// Where each board sits along -Z, and how far apart consecutive boards are.
//
// The gap is *dynamic*: it scales with the boards it separates, so a ladder of
// big boards spreads out and a ladder of small boards packs in. This matters
// because the modes differ — Library is a uniform-size tier (even gaps),
// while Daily and Infinite ramp up in size (gaps that grow with the ladder).
//
// Center-to-center distance between board j and j+1:
//     ((size_j + size_{j+1}) / 2) * boxSpacing * spacingPerCell  +  boardGap
//
// The `(a+b)/2` term keeps neighbours from overlapping regardless of their
// sizes; `spacingPerCell` is the proportional knob and `boardGap` a flat
// additive one. Defaults are tuned by eye against the board-intro ladder.

export interface BoardLayout {
    boxSpacing: number
    spacingPerCell: number
    boardGap: number
}

/**
 * World-Z position of every board in a ladder, given each board's grid size.
 * Board 0 sits at z=0; each subsequent board recedes by the size-scaled gap.
 */
export function boardZPositions(sizes: number[], layout: BoardLayout): number[] {
    const z: number[] = []
    let acc = 0
    for (let i = 0; i < sizes.length; i++) {
        if (i > 0) {
            const a = sizes[i - 1] ?? sizes[i] ?? 1
            const b = sizes[i] ?? a
            acc -= ((a + b) / 2) * layout.boxSpacing * layout.spacingPerCell + layout.boardGap
        }
        z[i] = acc
    }
    return z
}

/**
 * World-Z of a single board at `index` within a ladder of the given sizes.
 * Convenience wrapper over boardZPositions for callers that only need one.
 */
export function boardZAt(sizes: number[], index: number, layout: BoardLayout): number {
    return boardZPositions(sizes.slice(0, index + 1), layout)[index] ?? 0
}

/**
 * Leva-backed board-layout controls, shared by every consumer that positions
 * boards or aims the camera at them (Level, CameraManager, IntroCamera). Leva
 * merges identical control paths, so all callers read one source of truth —
 * no more three separate `boardSpacing: 16` knobs drifting apart.
 */
export function useBoardLayout(): BoardLayout {
    const { boxSpacing, spacingPerCell, boardGap } = useControls('Level', {
        boxSpacing: { value: 1, min: 1, max: 2, step: 0.01 },
        spacing: folder({
            spacingPerCell: { value: 0.9, min: 0, max: 5, step: 0.05, label: 'gap ×cell' },
            boardGap: { value: 2.5, min: -10, max: 30, step: 0.5, label: 'gap +flat' },
        }),
    })
    return { boxSpacing, spacingPerCell, boardGap }
}
