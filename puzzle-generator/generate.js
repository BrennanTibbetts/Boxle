import { writeFileSync, readFileSync, existsSync } from 'fs'

// Thrown when a single generation attempt blows its time budget mid-search.
// Caught at the attempt boundary in generatePuzzle, which abandons the
// attempt and retries with a fresh seed. Without this, one runaway
// repairBoard run measured 79s — the budget was only checked at attempt
// boundaries, never inside the inner loops.
class DeadlineReached extends Error {}

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

// --- PRNG ---

function seededRng(seed) {
  let s = Math.abs(Math.floor(seed)) % 2147483647 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]]

function chebyshev(r1, c1, r2, c2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2))
}

// --- Phase 1: Star Placement ---
// Places N*S stars row-by-row via backtracking. Every star placed satisfies
// all constraints by construction — nothing is placed then checked.

function placeStars(N, S, rng) {
  const colCount = new Array(N).fill(0)
  const placed = []

  function backtrack(row, starsInRow) {
    if (row === N) return colCount.every(c => c === S)
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

// --- Phase 2a: Region Growth ---
// Grows N connected regions simultaneously via randomized BFS from star seeds.
// Every region is contiguous by construction.

function growRegions(N, stars, rng) {
  const board = Array.from({ length: N }, () => new Array(N).fill(-1))

  for (let i = 0; i < stars.length; i++) {
    const [r, c] = stars[i]
    board[r][c] = i
  }

  const frontier = []
  for (let i = 0; i < stars.length; i++) {
    const [r, c] = stars[i]
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === -1)
        frontier.push([i, nr, nc])
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
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === -1)
        frontier.push([regionId, nr, nc])
    }
  }

  return board
}

// --- Connectivity check ---
// Returns true if regionId stays connected after removing [removeR, removeC].

function isConnectedWithout(board, N, regionId, removeR, removeC) {
  const cells = []
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (board[r][c] === regionId && !(r === removeR && c === removeC))
        cells.push([r, c])

  if (cells.length === 0) return true

  const visited = new Set()
  visited.add(cells[0][0] * N + cells[0][1])
  const queue = [cells[0]]

  // Index-pointer dequeue — Array.shift() is O(queue length), which turns
  // the BFS quadratic on large regions inside repairBoard's loop.
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head]
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

// --- Phase 3: Alternative Solution Finder ---
// Searches for a valid star placement different from intendedStars using
// MRV backtracking with forward checking. Returns altByRegion[reg] = [r, c],
// or null if no alternative exists (puzzle is unique).
// Note: designed for S=1; S>1 support is partial.

function findAlternativeSolution(board, N, S, intendedStars, deadline = Infinity) {
  const regionCells = Array.from({ length: N }, () => [])
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      regionCells[board[r][c]].push([r, c])

  const intendedKey = new Set(intendedStars.map(([r, c]) => r * N + c))

  const starGrid = Array.from({ length: N }, () => new Array(N).fill(false))
  const rowCount = new Array(N).fill(0)
  const colCount = new Array(N).fill(0)
  const regionCount = new Array(N).fill(0)
  const placed = []
  let nodes = 0

  function getCandidates(reg) {
    return regionCells[reg].filter(([r, c]) => {
      if (starGrid[r][c] || rowCount[r] >= S || colCount[c] >= S) return false
      for (const [pr, pc] of placed)
        if (chebyshev(r, c, pr, pc) <= 1) return false
      return true
    })
  }

  function backtrack() {
    // Bail mid-search if the attempt budget is spent. Checked every 1024
    // nodes so the clock read isn't itself a hot-path cost.
    if ((++nodes & 1023) === 0 && nowMs() > deadline) throw new DeadlineReached()

    if (placed.length === N * S) {
      for (const [r, c] of placed)
        if (!intendedKey.has(r * N + c)) return true
      return false
    }

    let bestReg = -1, bestCount = Infinity
    // Keep the winning candidate list from the min-scan — getCandidates
    // re-filters the whole region against every placed star, so calling
    // it again for the chosen region doubles the innermost cost.
    let bestCands = null
    for (let reg = 0; reg < N; reg++) {
      if (regionCount[reg] >= S) continue
      const cands = getCandidates(reg)
      if (cands.length === 0) return false
      if (cands.length < bestCount) {
        bestReg = reg
        bestCount = cands.length
        bestCands = cands
        if (bestCount === 1) break
      }
    }

    if (bestReg === -1 || bestCands === null) return false

    for (const [r, c] of bestCands) {
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

  const altByRegion = new Array(N)
  for (const [r, c] of placed)
    altByRegion[board[r][c]] = [r, c]
  return altByRegion
}

// --- Phase 2c: Uniqueness Repair ---
// Iteratively breaks alternative solutions by moving conflict cells to adjacent
// regions. Repair choices are driven by the solver output — not random sampling.
// Connectivity is verified before every move. Never moves star cells.

function repairBoard(board, N, S, stars, rng, deadline = Infinity) {
  const starKeySet = new Set(stars.map(([r, c]) => r * N + c))

  for (let iter = 0; iter < 500; iter++) {
    if (nowMs() > deadline) throw new DeadlineReached()
    const alt = findAlternativeSolution(board, N, S, stars, deadline)
    if (!alt) return board

    const conflicts = []
    for (let reg = 0; reg < N; reg++) {
      const [ar, ac] = alt[reg]
      const [sr, sc] = stars[reg]
      if (ar !== sr || ac !== sc) {
        if (!starKeySet.has(ar * N + ac))
          conflicts.push({ reg, r: ar, c: ac })
      }
    }

    if (conflicts.length === 0) return null

    const shuffled = shuffle(conflicts, rng)
    let repaired = false

    // Pass 1: move a conflict cell directly to an adjacent region
    for (const { reg, r, c } of shuffled) {
      const adjRegs = new Set()
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] !== reg)
          adjRegs.add(board[nr][nc])
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

    // Pass 2: two-hop — move a neighbor of a conflict cell to a foreign region
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

// --- Region generation outer loop ---
// Tries up to 30 BFS seeds per star placement before giving up.

function generateRegions(N, S, stars, masterSeed, deadline = Infinity) {
  for (let bfsSeed = 0; bfsSeed < 30; bfsSeed++) {
    if (nowMs() > deadline) throw new DeadlineReached()
    const bfsRng = seededRng(masterSeed * 1000 + bfsSeed + 1)
    const board = growRegions(N, stars, bfsRng)
    const repairRng = seededRng(masterSeed * 9999 + bfsSeed + 1)
    const result = repairBoard(board, N, S, stars, repairRng, deadline)
    if (result !== null) return result
  }
  return null
}

// --- Puzzle assembly ---
// Encoding: solution box in region r → the string `${r}*`, regular box →
// the number r. decodeBoard in src/utils/puzzle.ts relies on this exact
// shape (string = solution), as will the iOS port — see RawBox in
// src/types/puzzle.ts.

function generatePuzzle(N, S, seed, attemptBudgetMs = 0) {
  for (let attempt = 0; attempt < 100; attempt++) {
    // Each attempt gets its own fresh budget: a single attempt that stalls
    // is abandoned (DeadlineReached) and the next seed is tried, rather
    // than letting one runaway repair consume the whole build.
    const deadline = attemptBudgetMs > 0 ? nowMs() + attemptBudgetMs : Infinity
    const stars = placeStars(N, S, seededRng(seed * 1000 + attempt + 1))
    if (!stars) continue

    let board
    try {
      board = generateRegions(N, S, stars, seed * 999 + attempt + 1, deadline)
    } catch (e) {
      if (e instanceof DeadlineReached) continue
      throw e
    }
    if (!board) continue

    const starKeySet = new Set(stars.map(([r, c]) => r * N + c))
    const compactBoard = Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => {
        const regionId = board[r][c]
        return starKeySet.has(r * N + c) ? `${regionId}*` : regionId
      })
    )

    return { Board: compactBoard }
  }
  return null
}

// --- CLI ---

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[i + 1]
        i++
      } else {
        result[key] = true
      }
    }
  }
  return result
}

function main() {
  const params = parseArgs()

  const N = parseInt(params.n)
  const S = parseInt(params.s ?? '1')
  const count = parseInt(params.count ?? '10')
  const masterSeed = parseInt(params.seed ?? String(Date.now()))
  const outPath = params.out ?? `./generated-puzzles/puzzles_n${N}_s${S}.json`
  const append = params.append === true
  // Per-attempt wall-clock budget. 0 = unbounded (legacy behaviour). At large
  // sizes a single repair can otherwise hang for tens of seconds; a bounded
  // attempt is abandoned and retried with a fresh seed instead.
  const budgetMs = parseInt(params.budget ?? '0')

  if (!N || isNaN(N)) {
    console.error('Usage: node generate.js --n <gridSize> [--s <stars>] [--count <n>] [--out <path>] [--seed <n>] [--append]')
    console.error('  --n      Grid size (required). S=1: 4–12, S=2: 8–11')
    console.error('  --s      Stars per row/column/region (default: 1)')
    console.error('  --count  Number of puzzles to generate (default: 10)')
    console.error('  --out    Output file path')
    console.error('  --seed   Master PRNG seed for reproducibility')
    console.error('  --append Append to existing file instead of overwriting')
    console.error('  --budget Per-attempt time budget in ms (0 = unbounded)')
    process.exit(1)
  }

  console.log(`Generating ${count} Boxle puzzle(s): N=${N}, S=${S}, seed=${masterSeed}`)

  const puzzles = []
  let attempts = 0

  while (puzzles.length < count && attempts < count * 50) {
    const puzzle = generatePuzzle(N, S, masterSeed + attempts, budgetMs)
    attempts++
    if (puzzle) {
      puzzles.push(puzzle)
      process.stdout.write(`\r  ${puzzles.length}/${count} puzzles (${attempts} attempts)`)
    }
  }
  process.stdout.write('\n')

  if (puzzles.length < count)
    console.warn(`Warning: only generated ${puzzles.length}/${count} puzzles after ${attempts} attempts`)

  let output = puzzles
  if (append && existsSync(outPath)) {
    try {
      const existing = JSON.parse(readFileSync(outPath, 'utf8'))
      output = [...existing, ...puzzles]
      console.log(`Appending to existing file (${existing.length} + ${puzzles.length} puzzles)`)
    } catch {
      console.warn('Could not read existing file, overwriting')
    }
  }

  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`Wrote ${output.length} puzzle(s) to ${outPath}`)
}

main()
