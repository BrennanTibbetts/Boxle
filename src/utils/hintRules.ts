import { BoxState } from '../types/game'
import type { BoxStateValue, LevelGrid } from '../types/game'

export interface BoxRef {
    row: number
    col: number
}

// answer     — boxle must go here
// source     — boxes that create the logical constraint
// eliminate  — boxes logically ruled out by the constraint
export type HintBoxRole = 'answer' | 'source' | 'eliminate'

// ---------------------------------------------------------------------------
// Structured description tokens
// ---------------------------------------------------------------------------

export type DescToken =
    | { type: 'text';   content: string }
    | { type: 'region'; groupId: number }
    | { type: 'row' }
    | { type: 'col' }

export type HintDescription = DescToken[]

const t = (content: string): DescToken => ({ type: 'text', content })
const region = (groupId: number): DescToken => ({ type: 'region', groupId })
const row: DescToken = { type: 'row' }
const col: DescToken = { type: 'col' }

export interface HintResult {
    ruleId: string
    description: HintDescription
    levelIndex: number
    answerBoxes: BoxRef[]
    sourceBoxes: BoxRef[]
    eliminateBoxes: BoxRef[]
}

// Built once per hint search and passed to every rule. Saves N rebuilds of
// groupMap (one per rule that needs it) and centralises the grid dimension.
export interface HintContext {
    levelIndex: number
    levelMatrix: number[][]
    grid: LevelGrid
    n: number
    groupMap: Map<number, BoxRef[]>
}

export interface HintRule {
    id: string
    priority: number
    find(ctx: HintContext): HintResult | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAvailable(state: BoxStateValue): boolean {
    return state === BoxState.BLANK
}

function avail(boxes: BoxRef[], grid: LevelGrid): BoxRef[] {
    return boxes.filter(({ row, col }) => isAvailable(grid[row][col]))
}

function exclude(boxes: BoxRef[], others: BoxRef[]): BoxRef[] {
    return boxes.filter(b => !others.some(o => o.row === b.row && o.col === b.col))
}

function sameRow(boxes: BoxRef[]): number | null {
    if (boxes.length === 0) return null
    const r = boxes[0].row
    return boxes.every(b => b.row === r) ? r : null
}

function sameCol(boxes: BoxRef[]): number | null {
    if (boxes.length === 0) return null
    const c = boxes[0].col
    return boxes.every(b => b.col === c) ? c : null
}

function sameGroup(boxes: BoxRef[], levelMatrix: number[][]): number | null {
    if (boxes.length === 0) return null
    const g = levelMatrix[boxes[0].row][boxes[0].col]
    return boxes.every(b => levelMatrix[b.row][b.col] === g) ? g : null
}

function buildGroupMap(levelMatrix: number[][]): Map<number, BoxRef[]> {
    const n = levelMatrix.length
    const map = new Map<number, BoxRef[]>()
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
            const g = levelMatrix[r][c]
            if (!map.has(g)) map.set(g, [])
            map.get(g)!.push({ row: r, col: c })
        }
    return map
}

function rowBoxes(n: number, r: number): BoxRef[] {
    return Array.from({ length: n }, (_, c) => ({ row: r, col: c }))
}

function colBoxes(n: number, c: number): BoxRef[] {
    return Array.from({ length: n }, (_, r) => ({ row: r, col: c }))
}

function lineBoxes(n: number, byRows: boolean, idx: number): BoxRef[] {
    return byRows ? rowBoxes(n, idx) : colBoxes(n, idx)
}

function combinations<T>(arr: T[], k: number): T[][] {
    if (k <= 0) return [[]]
    if (k > arr.length) return []
    const [first, ...rest] = arr
    return [
        ...combinations(rest, k - 1).map(c => [first, ...c]),
        ...combinations(rest, k),
    ]
}

const COUNT_WORDS = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
function countWord(n: number): string {
    return COUNT_WORDS[n - 2] ?? String(n)
}

function listTokens(groupIds: number[]): DescToken[] {
    const result: DescToken[] = []
    for (let i = 0; i < groupIds.length; i++) {
        if (i > 0) result.push(t(groupIds.length === 2 ? ' and ' : (i === groupIds.length - 1 ? ', and ' : ', ')))
        result.push(region(groupIds[i]))
    }
    return result
}

// Mirrors useGame.placeBoxle: locks same row, same col, same region, and 8 neighbours.
function simulatePlacement(grid: LevelGrid, r: number, c: number, levelMatrix: number[][]): LevelGrid {
    const group = levelMatrix[r][c]
    return grid.map((rowData, i) =>
        rowData.map((s, j): BoxStateValue => {
            if (i === r && j === c) return BoxState.BOXLE
            if (s !== BoxState.BLANK) return s
            if (levelMatrix[i][j] === group) return BoxState.LOCK
            if (i === r || j === c) return BoxState.LOCK
            if (Math.abs(i - r) === 1 && Math.abs(j - c) === 1) return BoxState.LOCK
            return s
        }),
    )
}

type EmptyConstraint =
    | { kind: 'region'; idx: number; sourceBoxes: BoxRef[] }
    | { kind: 'row';    idx: number; sourceBoxes: BoxRef[] }
    | { kind: 'col';    idx: number; sourceBoxes: BoxRef[] }

// In `next`, find the first unsolved region/row/col with zero available cells.
// `originalGrid` supplies the source-box highlights (the constraint's current
// candidates, before tentative placement).
function findEmptyConstraint(
    next: LevelGrid,
    originalGrid: LevelGrid,
    n: number,
    groupMap: Map<number, BoxRef[]>,
): EmptyConstraint | null {
    for (const [g, boxes] of groupMap) {
        if (boxes.some(({ row, col }) => next[row][col] === BoxState.BOXLE)) continue
        if (avail(boxes, next).length === 0)
            return { kind: 'region', idx: g, sourceBoxes: avail(boxes, originalGrid) }
    }
    for (let r = 0; r < n; r++) {
        const boxes = rowBoxes(n, r)
        if (boxes.some(({ row, col }) => next[row][col] === BoxState.BOXLE)) continue
        if (avail(boxes, next).length === 0)
            return { kind: 'row', idx: r, sourceBoxes: avail(boxes, originalGrid) }
    }
    for (let c = 0; c < n; c++) {
        const boxes = colBoxes(n, c)
        if (boxes.some(({ row, col }) => next[row][col] === BoxState.BOXLE)) continue
        if (avail(boxes, next).length === 0)
            return { kind: 'col', idx: c, sourceBoxes: avail(boxes, originalGrid) }
    }
    return null
}

// Forward-chain the three single-in-* rules to a fixed point. Used by
// lookahead-1 to deepen the contradiction search beyond a single placement.
function propagateSingles(grid: LevelGrid, levelMatrix: number[][], n: number, groupMap: Map<number, BoxRef[]>): LevelGrid {
    let g = grid
    let changed = true
    while (changed) {
        changed = false
        for (const [, boxes] of groupMap) {
            if (boxes.some(b => g[b.row][b.col] === BoxState.BOXLE)) continue
            const a = avail(boxes, g)
            if (a.length === 1) { g = simulatePlacement(g, a[0].row, a[0].col, levelMatrix); changed = true; break }
        }
        if (changed) continue
        for (let r = 0; r < n; r++) {
            if (g[r].some(s => s === BoxState.BOXLE)) continue
            const a = avail(rowBoxes(n, r), g)
            if (a.length === 1) { g = simulatePlacement(g, a[0].row, a[0].col, levelMatrix); changed = true; break }
        }
        if (changed) continue
        for (let c = 0; c < n; c++) {
            const boxes = colBoxes(n, c)
            if (boxes.some(b => g[b.row][b.col] === BoxState.BOXLE)) continue
            const a = avail(boxes, g)
            if (a.length === 1) { g = simulatePlacement(g, a[0].row, a[0].col, levelMatrix); changed = true; break }
        }
    }
    return g
}

// ---------------------------------------------------------------------------
// Naked-tuple shared logic
// ---------------------------------------------------------------------------

// "k regions only fit into k rows/cols" → other boxes in those rows/cols ruled out.
// Same logic for rows and cols, parameterized by `byRows`.
function findNakedTupleRegions(ctx: HintContext, byRows: boolean): HintResult | null {
    const { levelIndex, grid, n, groupMap } = ctx
    const groups = [...groupMap.entries()].filter(([, boxes]) => avail(boxes, grid).length > 0)
    const dimension = byRows ? 'row' : 'col'

    for (let k = 2; k < n; k++) {
        for (const subset of combinations(groups, k)) {
            const allAvail = subset.flatMap(([, boxes]) => avail(boxes, grid))
            const unionLines = new Set(allAvail.map(b => byRows ? b.row : b.col))
            if (unionLines.size !== k) continue
            const source = allAvail
            const elimBoxes = avail(
                exclude([...unionLines].flatMap(idx => lineBoxes(n, byRows, idx)), source),
                grid,
            )
            if (elimBoxes.length === 0) continue
            const gIds = subset.map(([g]) => g)
            const cnt = countWord(k)
            return {
                ruleId: `naked-tuple-regions-${dimension}s`, levelIndex,
                description: [
                    t('The '), ...listTokens(gIds),
                    t(` regions can only be placed in these ${cnt} ${byRows ? 'rows' : 'columns'}, so the other boxes in these ${byRows ? 'rows' : 'columns'} can be ruled out.`),
                ],
                answerBoxes: [], sourceBoxes: source, eliminateBoxes: elimBoxes,
            }
        }
    }
    return null
}

// "k rows/cols only touch k regions" → those regions' boxes outside the lines ruled out.
function findNakedTupleLines(ctx: HintContext, byRows: boolean): HintResult | null {
    const { levelIndex, levelMatrix, grid, n, groupMap } = ctx
    const dimension = byRows ? 'row' : 'col'

    // Lines that already contain a boxle don't need another — exclude them so
    // the pigeonhole (k regions fill k lines) doesn't count already-solved lines.
    const lineIndices = Array.from({ length: n }, (_, i) => i)
        .filter(idx => !lineBoxes(n, byRows, idx).some(({ row, col }) => grid[row][col] === BoxState.BOXLE))

    for (let k = 2; k < n; k++) {
        for (const subset of combinations(lineIndices, k)) {
            const allAvail = subset.flatMap(idx => avail(lineBoxes(n, byRows, idx), grid))
            if (allAvail.length === 0) continue
            const unionGroups = new Set(allAvail.map(b => levelMatrix[b.row][b.col]))
            if (unionGroups.size !== k) continue
            const source = allAvail
            const elimBoxes = avail(
                exclude([...unionGroups].flatMap(g => groupMap.get(g)!), source),
                grid,
            )
            if (elimBoxes.length === 0) continue
            const gIds = [...unionGroups]
            const cnt = countWord(k)
            return {
                ruleId: `naked-tuple-${dimension}s-regions`, levelIndex,
                description: [
                    t(`These ${cnt} ${byRows ? 'rows' : 'columns'} only touch the `), ...listTokens(gIds),
                    t(` regions — their boxles must sit in these ${byRows ? 'rows' : 'columns'}, so `), ...listTokens(gIds),
                    t(` boxes outside these ${byRows ? 'rows' : 'columns'} can be ruled out.`),
                ],
                answerBoxes: [], sourceBoxes: source, eliminateBoxes: elimBoxes,
            }
        }
    }
    return null
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export const HINT_RULES: HintRule[] = [

    // ── Level 1: Direct placement ──────────────────────────────────────────

    {
        id: 'single-in-group',
        priority: 1,
        find({ levelIndex, grid, groupMap }) {
            for (const [g, boxes] of groupMap) {
                const a = avail(boxes, grid)
                if (a.length === 1)
                    return {
                        ruleId: 'single-in-group', levelIndex,
                        description: [t('Only one box is left in the '), region(g), t(' region — the boxle must go here.')],
                        answerBoxes: a, sourceBoxes: exclude(boxes, a), eliminateBoxes: [],
                    }
            }
            return null
        },
    },

    {
        id: 'single-in-row',
        priority: 2,
        find({ levelIndex, grid, n }) {
            for (let r = 0; r < n; r++) {
                const boxes = rowBoxes(n, r)
                const a = avail(boxes, grid)
                if (a.length === 1)
                    return {
                        ruleId: 'single-in-row', levelIndex,
                        description: [t('Only one box is left in '), row, t(' — the boxle must go here.')],
                        answerBoxes: a, sourceBoxes: exclude(boxes, a), eliminateBoxes: [],
                    }
            }
            return null
        },
    },

    {
        id: 'single-in-col',
        priority: 3,
        find({ levelIndex, grid, n }) {
            for (let c = 0; c < n; c++) {
                const boxes = colBoxes(n, c)
                const a = avail(boxes, grid)
                if (a.length === 1)
                    return {
                        ruleId: 'single-in-col', levelIndex,
                        description: [t('Only one box is left in '), col, t(' — the boxle must go here.')],
                        answerBoxes: a, sourceBoxes: exclude(boxes, a), eliminateBoxes: [],
                    }
            }
            return null
        },
    },

    // ── Level 2: Region–line interaction ───────────────────────────────────

    {
        id: 'region-locked-row',
        priority: 4,
        find({ levelIndex, grid, n, groupMap }) {
            for (const [g, boxes] of groupMap) {
                const a = avail(boxes, grid)
                if (a.length < 2) continue
                const r = sameRow(a)
                if (r === null) continue
                const elimBoxes = avail(exclude(rowBoxes(n, r), a), grid)
                if (elimBoxes.length === 0) continue
                return {
                    ruleId: 'region-locked-row', levelIndex,
                    description: [t('The '), region(g), t(" region's remaining boxes all fall in "), row, t('. Its boxle must go here, so the other boxes in this row can be ruled out.')],
                    answerBoxes: [], sourceBoxes: a, eliminateBoxes: elimBoxes,
                }
            }
            return null
        },
    },

    {
        id: 'region-locked-col',
        priority: 5,
        find({ levelIndex, grid, n, groupMap }) {
            for (const [g, boxes] of groupMap) {
                const a = avail(boxes, grid)
                if (a.length < 2) continue
                const c = sameCol(a)
                if (c === null) continue
                const elimBoxes = avail(exclude(colBoxes(n, c), a), grid)
                if (elimBoxes.length === 0) continue
                return {
                    ruleId: 'region-locked-col', levelIndex,
                    description: [t('The '), region(g), t(" region's remaining boxes all fall in "), col, t('. Its boxle must go here, so the other boxes in this column can be ruled out.')],
                    answerBoxes: [], sourceBoxes: a, eliminateBoxes: elimBoxes,
                }
            }
            return null
        },
    },

    {
        id: 'row-locked-region',
        priority: 6,
        find({ levelIndex, levelMatrix, grid, n, groupMap }) {
            for (let r = 0; r < n; r++) {
                const a = avail(rowBoxes(n, r), grid)
                if (a.length < 2) continue
                const g = sameGroup(a, levelMatrix)
                if (g === null) continue
                const elimBoxes = avail(exclude(groupMap.get(g)!, a), grid)
                if (elimBoxes.length === 0) continue
                return {
                    ruleId: 'row-locked-region', levelIndex,
                    description: [t('Every remaining box in '), row, t(' belongs to the '), region(g), t(' region. Its boxle must sit here, so the rest of '), region(g), t(' can be ruled out.')],
                    answerBoxes: [], sourceBoxes: a, eliminateBoxes: elimBoxes,
                }
            }
            return null
        },
    },

    {
        id: 'col-locked-region',
        priority: 7,
        find({ levelIndex, levelMatrix, grid, n, groupMap }) {
            for (let c = 0; c < n; c++) {
                const a = avail(colBoxes(n, c), grid)
                if (a.length < 2) continue
                const g = sameGroup(a, levelMatrix)
                if (g === null) continue
                const elimBoxes = avail(exclude(groupMap.get(g)!, a), grid)
                if (elimBoxes.length === 0) continue
                return {
                    ruleId: 'col-locked-region', levelIndex,
                    description: [t('Every remaining box in '), col, t(' belongs to the '), region(g), t(' region. Its boxle must sit here, so the rest of '), region(g), t(' can be ruled out.')],
                    answerBoxes: [], sourceBoxes: a, eliminateBoxes: elimBoxes,
                }
            }
            return null
        },
    },

    // ── Level 3: Naked tuples (k ≥ 2 regions ↔ rows/cols) ─────────────────

    { id: 'naked-tuple-regions-rows', priority: 8,  find: (ctx) => findNakedTupleRegions(ctx, true)  },
    { id: 'naked-tuple-regions-cols', priority: 9,  find: (ctx) => findNakedTupleRegions(ctx, false) },
    { id: 'naked-tuple-rows-regions', priority: 10, find: (ctx) => findNakedTupleLines(ctx, true)    },
    { id: 'naked-tuple-cols-regions', priority: 11, find: (ctx) => findNakedTupleLines(ctx, false)   },

    // ── Level 4: Adjacency-based elimination ───────────────────────────────

    // Tentatively place at each available cell; if doing so would leave any
    // unsolved region, row, or column with zero candidates, the cell can be
    // ruled out. The "blocked" set mirrors useGame.placeBoxle (same row, same
    // col, same region, and 8 neighbours).
    {
        id: 'adjacency-elimination',
        priority: 12,
        find({ levelIndex, levelMatrix, grid, n, groupMap }) {
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    if (!isAvailable(grid[r][c])) continue
                    const boxleGroup = levelMatrix[r][c]
                    const next = simulatePlacement(grid, r, c, levelMatrix)
                    const empty = findEmptyConstraint(next, grid, n, groupMap)
                    if (!empty) continue

                    const eliminateBoxes = [{ row: r, col: c }]
                    const sourceBoxes = empty.sourceBoxes
                    if (empty.kind === 'region')
                        return {
                            ruleId: 'adjacency-elimination', levelIndex,
                            description: [t('Placing a boxle here would leave '), region(empty.idx), t(' with no valid boxes — rule out this '), region(boxleGroup), t(' box.')],
                            answerBoxes: [], sourceBoxes, eliminateBoxes,
                        }
                    if (empty.kind === 'row')
                        return {
                            ruleId: 'adjacency-elimination', levelIndex,
                            description: [t('Placing a boxle here would leave '), row, t(' with no valid boxes — rule out this '), region(boxleGroup), t(' box.')],
                            answerBoxes: [], sourceBoxes, eliminateBoxes,
                        }
                    return {
                        ruleId: 'adjacency-elimination', levelIndex,
                        description: [t('Placing a boxle here would leave '), col, t(' with no valid boxes — rule out this '), region(boxleGroup), t(' box.')],
                        answerBoxes: [], sourceBoxes, eliminateBoxes,
                    }
                }
            }
            return null
        },
    },

    // ── Level 5: One-ply lookahead ─────────────────────────────────────────

    // Tentatively place, propagate single-in-* deductions to a fixed point,
    // then check for an empty region/row/col. Catches contradictions that only
    // surface after a chain of forced placements.
    {
        id: 'lookahead-1',
        priority: 13,
        find({ levelIndex, levelMatrix, grid, n, groupMap }) {
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    if (!isAvailable(grid[r][c])) continue
                    const boxleGroup = levelMatrix[r][c]
                    const placed = simulatePlacement(grid, r, c, levelMatrix)
                    // Skip if the shallow rule already catches this — keeps the
                    // hint specific to deductions that genuinely need lookahead.
                    if (findEmptyConstraint(placed, grid, n, groupMap)) continue

                    const propagated = propagateSingles(placed, levelMatrix, n, groupMap)
                    const empty = findEmptyConstraint(propagated, grid, n, groupMap)
                    if (!empty) continue

                    const eliminateBoxes = [{ row: r, col: c }]
                    const sourceBoxes = empty.sourceBoxes
                    if (empty.kind === 'region')
                        return {
                            ruleId: 'lookahead-1', levelIndex,
                            description: [t('Placing a boxle here forces a chain that would leave '), region(empty.idx), t(' with no valid boxes — rule out this '), region(boxleGroup), t(' box.')],
                            answerBoxes: [], sourceBoxes, eliminateBoxes,
                        }
                    if (empty.kind === 'row')
                        return {
                            ruleId: 'lookahead-1', levelIndex,
                            description: [t('Placing a boxle here forces a chain that would leave '), row, t(' with no valid boxes — rule out this '), region(boxleGroup), t(' box.')],
                            answerBoxes: [], sourceBoxes, eliminateBoxes,
                        }
                    return {
                        ruleId: 'lookahead-1', levelIndex,
                        description: [t('Placing a boxle here forces a chain that would leave '), col, t(' with no valid boxes — rule out this '), region(boxleGroup), t(' box.')],
                        answerBoxes: [], sourceBoxes, eliminateBoxes,
                    }
                }
            }
            return null
        },
    },

    // ── Last resort: impossible board state ────────────────────────────────

    {
        id: 'impossible-state',
        priority: 14,
        find({ levelIndex, grid, n, groupMap }) {
            for (const [g, boxes] of groupMap) {
                const hasBoxle = boxes.some(b => grid[b.row][b.col] === BoxState.BOXLE)
                if (hasBoxle) continue
                if (avail(boxes, grid).length === 0)
                    return {
                        ruleId: 'impossible-state', levelIndex,
                        description: [t('The '), region(g), t(' region has no remaining boxes. Some of your marks may be wrong — try clearing them.')],
                        answerBoxes: [], sourceBoxes: [], eliminateBoxes: [],
                    }
            }

            for (let r = 0; r < n; r++) {
                const boxes = rowBoxes(n, r)
                const hasBoxle = boxes.some(b => grid[b.row][b.col] === BoxState.BOXLE)
                if (hasBoxle) continue
                if (avail(boxes, grid).length === 0)
                    return {
                        ruleId: 'impossible-state', levelIndex,
                        description: [t('A row has no remaining boxes. Some of your marks may be wrong — try clearing them.')],
                        answerBoxes: [], sourceBoxes: [], eliminateBoxes: [],
                    }
            }

            for (let c = 0; c < n; c++) {
                const boxes = colBoxes(n, c)
                const hasBoxle = boxes.some(b => grid[b.row][b.col] === BoxState.BOXLE)
                if (hasBoxle) continue
                if (avail(boxes, grid).length === 0)
                    return {
                        ruleId: 'impossible-state', levelIndex,
                        description: [t('A column has no remaining boxes. Some of your marks may be wrong — try clearing them.')],
                        answerBoxes: [], sourceBoxes: [], eliminateBoxes: [],
                    }
            }

            return null
        },
    },
]

export function findBestHint(
    levelIndex: number,
    levelMatrix: number[][],
    grid: LevelGrid,
): HintResult | null {
    const ctx: HintContext = {
        levelIndex,
        levelMatrix,
        grid,
        n: levelMatrix.length,
        groupMap: buildGroupMap(levelMatrix),
    }
    for (const rule of HINT_RULES) {
        const result = rule.find(ctx)
        if (result) return result
    }
    return null
}
