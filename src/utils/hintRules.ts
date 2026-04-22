import { BoxState } from '../types/game'
import type { BoxStateValue, LevelGrid } from '../types/game'

export interface CellRef {
    row: number
    col: number
}

// target     — star must go here
// source     — cells that create the logical constraint
// eliminate  — cells logically ruled out by the constraint
export type HintCellRole = 'target' | 'source' | 'eliminate'

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
    targetCells: CellRef[]
    sourceCells: CellRef[]
    eliminateCells: CellRef[]
}

export interface HintRule {
    id: string
    priority: number
    find(levelIndex: number, levelMatrix: number[][], grid: LevelGrid): HintResult | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAvailable(state: BoxStateValue): boolean {
    return state === BoxState.BLANK
}

function avail(cells: CellRef[], grid: LevelGrid): CellRef[] {
    return cells.filter(({ row, col }) => isAvailable(grid[row][col]))
}

function exclude(cells: CellRef[], others: CellRef[]): CellRef[] {
    return cells.filter(c => !others.some(o => o.row === c.row && o.col === c.col))
}

function sameRow(cells: CellRef[]): number | null {
    if (cells.length === 0) return null
    const r = cells[0].row
    return cells.every(c => c.row === r) ? r : null
}

function sameCol(cells: CellRef[]): number | null {
    if (cells.length === 0) return null
    const c = cells[0].col
    return cells.every(c2 => c2.col === c) ? c : null
}

function sameGroup(cells: CellRef[], levelMatrix: number[][]): number | null {
    if (cells.length === 0) return null
    const g = levelMatrix[cells[0].row][cells[0].col]
    return cells.every(c => levelMatrix[c.row][c.col] === g) ? g : null
}

function buildGroupMap(levelMatrix: number[][]): Map<number, CellRef[]> {
    const n = levelMatrix.length
    const map = new Map<number, CellRef[]>()
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
            const g = levelMatrix[r][c]
            if (!map.has(g)) map.set(g, [])
            map.get(g)!.push({ row: r, col: c })
        }
    return map
}

function rowCells(n: number, r: number): CellRef[] {
    return Array.from({ length: n }, (_, c) => ({ row: r, col: c }))
}

function colCells(n: number, c: number): CellRef[] {
    return Array.from({ length: n }, (_, r) => ({ row: r, col: c }))
}

function combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]]
    if (arr.length < k) return []
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

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export const HINT_RULES: HintRule[] = [

    // ── Level 1: Direct placement ──────────────────────────────────────────

    {
        id: 'single-in-group',
        priority: 1,
        find(levelIndex, levelMatrix, grid) {
            for (const [g, cells] of buildGroupMap(levelMatrix)) {
                const a = avail(cells, grid)
                if (a.length === 1)
                    return {
                        ruleId: 'single-in-group', levelIndex,
                        description: [t('Only one cell is left in the '), region(g), t(' region — the star must go here.')],
                        targetCells: a, sourceCells: exclude(cells, a), eliminateCells: [],
                    }
            }
            return null
        },
    },

    {
        id: 'single-in-row',
        priority: 2,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            for (let r = 0; r < n; r++) {
                const cells = rowCells(n, r)
                const a = avail(cells, grid)
                if (a.length === 1)
                    return {
                        ruleId: 'single-in-row', levelIndex,
                        description: [t('Only one cell is left in '), row, t(' — the star must go here.')],
                        targetCells: a, sourceCells: exclude(cells, a), eliminateCells: [],
                    }
            }
            return null
        },
    },

    {
        id: 'single-in-col',
        priority: 3,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            for (let c = 0; c < n; c++) {
                const cells = colCells(n, c)
                const a = avail(cells, grid)
                if (a.length === 1)
                    return {
                        ruleId: 'single-in-col', levelIndex,
                        description: [t('Only one cell is left in '), col, t(' — the star must go here.')],
                        targetCells: a, sourceCells: exclude(cells, a), eliminateCells: [],
                    }
            }
            return null
        },
    },

    // ── Level 2: Region–line interaction ───────────────────────────────────

    {
        id: 'region-locked-row',
        priority: 4,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            for (const [g, cells] of buildGroupMap(levelMatrix)) {
                const a = avail(cells, grid)
                if (a.length < 2) continue
                const r = sameRow(a)
                if (r === null) continue
                const elimCells = avail(exclude(rowCells(n, r), a), grid)
                if (elimCells.length === 0) continue
                return {
                    ruleId: 'region-locked-row', levelIndex,
                    description: [t('The '), region(g), t(" region's remaining cells all fall in "), row, t('. Its star must go here, so the other cells in this row can be ruled out.')],
                    targetCells: [], sourceCells: a, eliminateCells: elimCells,
                }
            }
            return null
        },
    },

    {
        id: 'region-locked-col',
        priority: 5,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            for (const [g, cells] of buildGroupMap(levelMatrix)) {
                const a = avail(cells, grid)
                if (a.length < 2) continue
                const c = sameCol(a)
                if (c === null) continue
                const elimCells = avail(exclude(colCells(n, c), a), grid)
                if (elimCells.length === 0) continue
                return {
                    ruleId: 'region-locked-col', levelIndex,
                    description: [t('The '), region(g), t(" region's remaining cells all fall in "), col, t('. Its star must go here, so the other cells in this column can be ruled out.')],
                    targetCells: [], sourceCells: a, eliminateCells: elimCells,
                }
            }
            return null
        },
    },

    {
        id: 'row-locked-region',
        priority: 6,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groupMap = buildGroupMap(levelMatrix)
            for (let r = 0; r < n; r++) {
                const a = avail(rowCells(n, r), grid)
                if (a.length < 2) continue
                const g = sameGroup(a, levelMatrix)
                if (g === null) continue
                const elimCells = avail(exclude(groupMap.get(g)!, a), grid)
                if (elimCells.length === 0) continue
                return {
                    ruleId: 'row-locked-region', levelIndex,
                    description: [t('Every remaining cell in '), row, t(' belongs to the '), region(g), t(' region. Its star must sit here, so the rest of '), region(g), t(' can be ruled out.')],
                    targetCells: [], sourceCells: a, eliminateCells: elimCells,
                }
            }
            return null
        },
    },

    {
        id: 'col-locked-region',
        priority: 7,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groupMap = buildGroupMap(levelMatrix)
            for (let c = 0; c < n; c++) {
                const a = avail(colCells(n, c), grid)
                if (a.length < 2) continue
                const g = sameGroup(a, levelMatrix)
                if (g === null) continue
                const elimCells = avail(exclude(groupMap.get(g)!, a), grid)
                if (elimCells.length === 0) continue
                return {
                    ruleId: 'col-locked-region', levelIndex,
                    description: [t('Every remaining cell in '), col, t(' belongs to the '), region(g), t(' region. Its star must sit here, so the rest of '), region(g), t(' can be ruled out.')],
                    targetCells: [], sourceCells: a, eliminateCells: elimCells,
                }
            }
            return null
        },
    },

    // ── Level 3: Naked tuples (k ≥ 2 regions ↔ rows/cols) ─────────────────

    {
        id: 'naked-tuple-regions-rows',
        priority: 8,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groups = [...buildGroupMap(levelMatrix).entries()]
                .filter(([, cells]) => avail(cells, grid).length > 0)
            for (let k = 2; k < n; k++) {
                for (const subset of combinations(groups, k)) {
                    const allAvail = subset.flatMap(([, cells]) => avail(cells, grid))
                    const unionRows = new Set(allAvail.map(c => c.row))
                    if (unionRows.size !== k) continue
                    const source = allAvail
                    const elimCells = avail(exclude([...unionRows].flatMap(r => rowCells(n, r)), source), grid)
                    if (elimCells.length === 0) continue
                    const gIds = subset.map(([g]) => g)
                    const cnt = countWord(k)
                    return {
                        ruleId: 'naked-tuple-regions-rows', levelIndex,
                        description: [t('The '), ...listTokens(gIds), t(` regions can only be placed in these ${cnt} rows, so the other cells in these rows can be ruled out.`)],
                        targetCells: [], sourceCells: source, eliminateCells: elimCells,
                    }
                }
            }
            return null
        },
    },

    {
        id: 'naked-tuple-regions-cols',
        priority: 9,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groups = [...buildGroupMap(levelMatrix).entries()]
                .filter(([, cells]) => avail(cells, grid).length > 0)
            for (let k = 2; k < n; k++) {
                for (const subset of combinations(groups, k)) {
                    const allAvail = subset.flatMap(([, cells]) => avail(cells, grid))
                    const unionCols = new Set(allAvail.map(c => c.col))
                    if (unionCols.size !== k) continue
                    const source = allAvail
                    const elimCells = avail(exclude([...unionCols].flatMap(c => colCells(n, c)), source), grid)
                    if (elimCells.length === 0) continue
                    const gIds = subset.map(([g]) => g)
                    const cnt = countWord(k)
                    return {
                        ruleId: 'naked-tuple-regions-cols', levelIndex,
                        description: [t('The '), ...listTokens(gIds), t(` regions can only be placed in these ${cnt} columns, so the other cells in these columns can be ruled out.`)],
                        targetCells: [], sourceCells: source, eliminateCells: elimCells,
                    }
                }
            }
            return null
        },
    },

    {
        id: 'naked-tuple-rows-regions',
        priority: 10,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groupMap = buildGroupMap(levelMatrix)
            for (let k = 2; k < n; k++) {
                const rowIndices = Array.from({ length: n }, (_, i) => i)
                for (const subset of combinations(rowIndices, k)) {
                    const allAvail = subset.flatMap(r => avail(rowCells(n, r), grid))
                    if (allAvail.length === 0) continue
                    const unionGroups = new Set(allAvail.map(c => levelMatrix[c.row][c.col]))
                    if (unionGroups.size !== k) continue
                    const source = allAvail
                    const elimCells = avail(exclude([...unionGroups].flatMap(g => groupMap.get(g)!), source), grid)
                    if (elimCells.length === 0) continue
                    const gIds = [...unionGroups]
                    const cnt = countWord(k)
                    return {
                        ruleId: 'naked-tuple-rows-regions', levelIndex,
                        description: [t(`These ${cnt} rows only touch the `), ...listTokens(gIds), t(` regions — their stars must sit in these rows, so `), ...listTokens(gIds), t(` cells outside these rows can be ruled out.`)],
                        targetCells: [], sourceCells: source, eliminateCells: elimCells,
                    }
                }
            }
            return null
        },
    },

    {
        id: 'naked-tuple-cols-regions',
        priority: 11,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groupMap = buildGroupMap(levelMatrix)
            for (let k = 2; k < n; k++) {
                const colIndices = Array.from({ length: n }, (_, i) => i)
                for (const subset of combinations(colIndices, k)) {
                    const allAvail = subset.flatMap(c => avail(colCells(n, c), grid))
                    if (allAvail.length === 0) continue
                    const unionGroups = new Set(allAvail.map(c => levelMatrix[c.row][c.col]))
                    if (unionGroups.size !== k) continue
                    const source = allAvail
                    const elimCells = avail(exclude([...unionGroups].flatMap(g => groupMap.get(g)!), source), grid)
                    if (elimCells.length === 0) continue
                    const gIds = [...unionGroups]
                    const cnt = countWord(k)
                    return {
                        ruleId: 'naked-tuple-cols-regions', levelIndex,
                        description: [t(`These ${cnt} columns only touch the `), ...listTokens(gIds), t(` regions — their stars must sit in these columns, so `), ...listTokens(gIds), t(` cells outside these columns can be ruled out.`)],
                        targetCells: [], sourceCells: source, eliminateCells: elimCells,
                    }
                }
            }
            return null
        },
    },

    // ── Level 4: Adjacency-based elimination ───────────────────────────────

    {
        id: 'adjacency-elimination',
        priority: 12,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groupMap = buildGroupMap(levelMatrix)

            // Groups that already have a placed star don't need a cell
            const solvedGroups = new Set<number>()
            for (const [g, cells] of groupMap)
                if (cells.some(c => grid[c.row][c.col] === BoxState.STAR))
                    solvedGroups.add(g)

            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    if (!isAvailable(grid[r][c])) continue
                    const starGroup = levelMatrix[r][c]
                    if (solvedGroups.has(starGroup)) continue

                    // Cells that become unavailable if star is placed at (r, c):
                    // same row, same col, all 8 neighbours
                    const blocked = new Set<string>()
                    for (let i = 0; i < n; i++) {
                        blocked.add(`${r},${i}`)
                        blocked.add(`${i},${c}`)
                    }
                    for (let dr = -1; dr <= 1; dr++)
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr, nc = c + dc
                            if (nr >= 0 && nr < n && nc >= 0 && nc < n)
                                blocked.add(`${nr},${nc}`)
                        }

                    // Check if any unsolved region would be left with no valid cells
                    for (const [g, cells] of groupMap) {
                        if (g === starGroup || solvedGroups.has(g)) continue
                        const remaining = cells.filter(cell =>
                            isAvailable(grid[cell.row][cell.col]) &&
                            !blocked.has(`${cell.row},${cell.col}`)
                        )
                        if (remaining.length === 0) {
                            return {
                                ruleId: 'adjacency-elimination', levelIndex,
                                description: [t('Placing a star here would leave '), region(g), t(' with no valid cells — rule out this '), region(starGroup), t(' cell.')],
                                targetCells: [],
                                sourceCells: avail(cells, grid),
                                eliminateCells: [{ row: r, col: c }],
                            }
                        }
                    }
                }
            }
            return null
        },
    },
    // ── Last resort: impossible board state ────────────────────────────────

    {
        id: 'impossible-state',
        priority: 13,
        find(levelIndex, levelMatrix, grid) {
            const n = levelMatrix.length
            const groupMap = buildGroupMap(levelMatrix)

            for (const [g, cells] of groupMap) {
                const hasStar = cells.some(c => grid[c.row][c.col] === BoxState.STAR)
                if (hasStar) continue
                if (avail(cells, grid).length === 0)
                    return {
                        ruleId: 'impossible-state', levelIndex,
                        description: [t('The '), region(g), t(' region has no remaining cells. Some of your marks may be wrong — try clearing them.')],
                        targetCells: [], sourceCells: [], eliminateCells: [],
                    }
            }

            for (let r = 0; r < n; r++) {
                const cells = rowCells(n, r)
                const hasStar = cells.some(c => grid[c.row][c.col] === BoxState.STAR)
                if (hasStar) continue
                if (avail(cells, grid).length === 0)
                    return {
                        ruleId: 'impossible-state', levelIndex,
                        description: [t('A row has no remaining cells. Some of your marks may be wrong — try clearing them.')],
                        targetCells: [], sourceCells: [], eliminateCells: [],
                    }
            }

            for (let c = 0; c < n; c++) {
                const cells = colCells(n, c)
                const hasStar = cells.some(cell => grid[cell.row][cell.col] === BoxState.STAR)
                if (hasStar) continue
                if (avail(cells, grid).length === 0)
                    return {
                        ruleId: 'impossible-state', levelIndex,
                        description: [t('A column has no remaining cells. Some of your marks may be wrong — try clearing them.')],
                        targetCells: [], sourceCells: [], eliminateCells: [],
                    }
            }

            return null
        },
    },
]

export function findBestHint(
    levelIndex: number,
    levelMatrix: number[][],
    grid: LevelGrid
): HintResult | null {
    for (const rule of HINT_RULES) {
        const result = rule.find(levelIndex, levelMatrix, grid)
        if (result) return result
    }
    return null
}
