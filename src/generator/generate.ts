import type { RawBoard } from '../types/puzzle'

type Rng = () => number
type Cell = [number, number]

function seededRng(seed: number): Rng {
    let s = Math.abs(Math.floor(seed)) % 2147483647 || 1
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[0, 1], [0, -1], [1, 0], [-1, 0]]

function chebyshev(r1: number, c1: number, r2: number, c2: number): number {
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2))
}

function placeStars(N: number, S: number, rng: Rng): Cell[] | null {
    const colCount = new Array<number>(N).fill(0)
    const placed: Cell[] = []

    function backtrack(row: number, starsInRow: number): boolean {
        if (row === N) return colCount.every((c) => c === S)
        if (starsInRow === S) return backtrack(row + 1, 0)

        const cols = shuffle([...Array(N).keys()], rng)
        for (const col of cols) {
            if (colCount[col] >= S) continue
            if (placed.some(([pr, pc]) => chebyshev(row, col, pr, pc) <= 1)) continue

            placed.push([row, col])
            colCount[col]++

            if (backtrack(row, starsInRow + 1)) return true

            placed.pop()
            colCount[col]--
        }
        return false
    }

    return backtrack(0, 0) ? placed : null
}

function growRegions(N: number, stars: Cell[], rng: Rng): number[][] {
    const board: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(-1))

    for (let i = 0; i < stars.length; i++) {
        const [r, c] = stars[i]
        board[r][c] = i
    }

    const frontier: [number, number, number][] = []
    for (let i = 0; i < stars.length; i++) {
        const [r, c] = stars[i]
        for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === -1) {
                frontier.push([i, nr, nc])
            }
        }
    }

    while (frontier.length > 0) {
        const idx = Math.floor(rng() * frontier.length)
        const [regionId, r, c] = frontier[idx]
        frontier[idx] = frontier[frontier.length - 1]
        frontier.pop()

        if (board[r][c] !== -1) continue

        board[r][c] = regionId
        for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === -1) {
                frontier.push([regionId, nr, nc])
            }
        }
    }

    return board
}

function isConnectedWithout(board: number[][], N: number, regionId: number, removeR: number, removeC: number): boolean {
    const cells: Cell[] = []
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (board[r][c] === regionId && !(r === removeR && c === removeC)) {
                cells.push([r, c])
            }
        }
    }

    if (cells.length === 0) return true

    const visited = new Set<number>()
    visited.add(cells[0][0] * N + cells[0][1])
    const queue: Cell[] = [cells[0]]

    while (queue.length > 0) {
        const [r, c] = queue.shift()!
        for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc
            if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue
            const key = nr * N + nc
            if (!visited.has(key) && board[nr][nc] === regionId && !(nr === removeR && nc === removeC)) {
                visited.add(key)
                queue.push([nr, nc])
            }
        }
    }

    return visited.size === cells.length
}

function findAlternativeSolution(board: number[][], N: number, S: number, intendedStars: Cell[]): Cell[] | null {
    const regionCells: Cell[][] = Array.from({ length: N }, () => [])
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            regionCells[board[r][c]].push([r, c])
        }
    }

    const intendedKey = new Set(intendedStars.map(([r, c]) => r * N + c))

    const starGrid: boolean[][] = Array.from({ length: N }, () => new Array<boolean>(N).fill(false))
    const rowCount = new Array<number>(N).fill(0)
    const colCount = new Array<number>(N).fill(0)
    const regionCount = new Array<number>(N).fill(0)
    const placed: Cell[] = []

    function getCandidates(reg: number): Cell[] {
        return regionCells[reg].filter(([r, c]) => {
            if (starGrid[r][c] || rowCount[r] >= S || colCount[c] >= S) return false
            for (const [pr, pc] of placed) {
                if (chebyshev(r, c, pr, pc) <= 1) return false
            }
            return true
        })
    }

    function backtrack(): boolean {
        if (placed.length === N * S) {
            for (const [r, c] of placed) {
                if (!intendedKey.has(r * N + c)) return true
            }
            return false
        }

        let bestReg = -1
        let bestCount = Infinity
        for (let reg = 0; reg < N; reg++) {
            if (regionCount[reg] >= S) continue
            const cands = getCandidates(reg)
            if (cands.length === 0) return false
            if (cands.length < bestCount) {
                bestReg = reg
                bestCount = cands.length
                if (bestCount === 1) break
            }
        }

        if (bestReg === -1) return false

        for (const [r, c] of getCandidates(bestReg)) {
            starGrid[r][c] = true
            rowCount[r]++
            colCount[c]++
            regionCount[bestReg]++
            placed.push([r, c])

            if (backtrack()) return true

            placed.pop()
            regionCount[bestReg]--
            colCount[c]--
            rowCount[r]--
            starGrid[r][c] = false
        }

        return false
    }

    if (!backtrack()) return null

    const altByRegion: Cell[] = new Array(N)
    for (const [r, c] of placed) {
        altByRegion[board[r][c]] = [r, c]
    }
    return altByRegion
}

function repairBoard(board: number[][], N: number, S: number, stars: Cell[], rng: Rng): number[][] | null {
    const starKeySet = new Set(stars.map(([r, c]) => r * N + c))

    for (let iter = 0; iter < 500; iter++) {
        const alt = findAlternativeSolution(board, N, S, stars)
        if (!alt) return board

        const conflicts: { reg: number; r: number; c: number }[] = []
        for (let reg = 0; reg < N; reg++) {
            const [ar, ac] = alt[reg]
            const [sr, sc] = stars[reg]
            if (ar !== sr || ac !== sc) {
                if (!starKeySet.has(ar * N + ac)) {
                    conflicts.push({ reg, r: ar, c: ac })
                }
            }
        }

        if (conflicts.length === 0) return null

        const shuffled = shuffle(conflicts, rng)
        let repaired = false

        for (const { reg, r, c } of shuffled) {
            const adjRegs = new Set<number>()
            for (const [dr, dc] of DIRS) {
                const nr = r + dr, nc = c + dc
                if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] !== reg) {
                    adjRegs.add(board[nr][nc])
                }
            }

            for (const targetReg of shuffle([...adjRegs], rng)) {
                if (isConnectedWithout(board, N, reg, r, c)) {
                    board[r][c] = targetReg
                    repaired = true
                    break
                }
            }
            if (repaired) break
        }

        if (!repaired) {
            outer: for (const { reg, r, c } of shuffled) {
                for (const [dr, dc] of DIRS) {
                    const nr = r + dr, nc = c + dc
                    if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue
                    if (board[nr][nc] !== reg || starKeySet.has(nr * N + nc)) continue

                    for (const [dr2, dc2] of DIRS) {
                        const nnr = nr + dr2, nnc = nc + dc2
                        if (nnr < 0 || nnr >= N || nnc < 0 || nnc >= N) continue
                        if (board[nnr][nnc] === reg) continue

                        if (isConnectedWithout(board, N, reg, nr, nc)) {
                            board[nr][nc] = board[nnr][nnc]
                            repaired = true
                            break outer
                        }
                    }
                }
            }
        }

        if (!repaired) return null
    }

    return null
}

function generateRegions(N: number, S: number, stars: Cell[], masterSeed: number): number[][] | null {
    for (let bfsSeed = 0; bfsSeed < 30; bfsSeed++) {
        const bfsRng = seededRng(masterSeed * 1000 + bfsSeed + 1)
        const board = growRegions(N, stars, bfsRng)
        const repairRng = seededRng(masterSeed * 9999 + bfsSeed + 1)
        const result = repairBoard(board, N, S, stars, repairRng)
        if (result !== null) return result
    }
    return null
}

// S=1 only. The S>1 codepath has known indexing bugs; locked at 1 until
// fixed (see project_boxle_generator_s2_broken). When re-enabling S>1,
// promote S back to a parameter and audit placeStars/generateRegions/
// findAlternativeSolution for region-index assumptions.
const S = 1

// Wall-clock budget for a single generate call. The synchronous codepath
// blocks the main thread while it runs, so an open-ended budget produces
// the kind of multi-minute hang that locked the user out of Arcade after
// completing a size-16 puzzle. Callers (mode providers) handle a null
// return by ending the run gracefully.
//
// 1500ms is large enough for sizes 4–14 to almost always succeed on the
// first attempt, and small enough that a worst-case timeout still feels
// like a stutter rather than a frozen tab.
const DEFAULT_TIME_BUDGET_MS = 1500

function nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function generateBoard(N: number, seed?: number, timeBudgetMs = DEFAULT_TIME_BUDGET_MS): RawBoard | null {
    const deadline = nowMs() + timeBudgetMs
    const masterSeed = seed ?? Math.floor(Math.random() * 2_000_000_000) + 1

    for (let attempt = 0; attempt < 100; attempt++) {
        if (nowMs() > deadline) return null

        const stars = placeStars(N, S, seededRng(masterSeed * 1000 + attempt + 1))
        if (!stars) continue

        const board = generateRegions(N, S, stars, masterSeed * 999 + attempt + 1)
        if (!board) continue

        const starKeySet = new Set(stars.map(([r, c]) => r * N + c))
        const compactBoard: RawBoard = Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
                const regionId = board[r][c]
                return starKeySet.has(r * N + c) ? `${regionId}*` : regionId
            })
        )

        return compactBoard
    }
    return null
}
