import { useControls, folder } from 'leva'

// Where each board sits along -Z, and how far apart consecutive boards are.
//
// The gap is *dynamic*: it scales with the boards it separates, so a ladder of
// big boards spreads out and a ladder of small boards packs in. This matters
// because the modes differ — Library is a uniform-size tier (even gaps),
// while Daily and Infinite ramp up in size (gaps that grow with the ladder).
//
// Center-to-center distance between board j and j+1:
//     ((size_j + size_{j+1}) / 2) * boxSpacing * spacingPerBox  +  boardGap
//
// The `(a+b)/2` term keeps neighbours from overlapping regardless of their
// sizes; `spacingPerBox` is the proportional knob and `boardGap` a flat
// additive one. Defaults are tuned by eye against the board-intro ladder.

// Default box spacing — the single source for every consumer of "how wide is
// one box in world units": the leva knob below, the camera-fit math
// (requiredCameraY), and Display's board-width-in-pixels calc. Don't redeclare
// it locally; the knob and the math must agree or portrait fit silently
// breaks when the knob moves.
export const BOX_SPACING = 1

export interface BoardLayout {
    boxSpacing: number
    spacingPerBox: number
    boardGap: number
}

/**
 * World X/Z of a box at (row, col) within its board group. Box and
 * InstancedLevel must place boxes identically (InstancedLevel's contract is
 * "visually identical to a blank Box"), so both call this.
 */
export function boxWorldXZ(row: number, col: number, gridSize: number, spacing: number): [number, number] {
    return [
        ((col - gridSize / 2) + 0.5) * spacing,
        ((row - gridSize / 2) + 0.5) * spacing,
    ]
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
            acc -= ((a + b) / 2) * layout.boxSpacing * layout.spacingPerBox + layout.boardGap
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
    const { boxSpacing, spacingPerBox, boardGap } = useControls('Level', {
        boxSpacing: { value: BOX_SPACING, min: 1, max: 2, step: 0.01 },
        spacing: folder({
            spacingPerBox: { value: 0.9, min: 0, max: 5, step: 0.05, label: 'gap ×box' },
            boardGap: { value: 2.5, min: -10, max: 30, step: 0.5, label: 'gap +flat' },
        }),
    })
    return { boxSpacing, spacingPerBox, boardGap }
}
