// Regenerates the full daily-pool JSONs in data/ — one file per grid size,
// 100 puzzles each, deterministic per-size seed for reproducibility.
//
// Usage:
//   node puzzle-generator/regen-daily-pool.js              # all sizes
//   node puzzle-generator/regen-daily-pool.js --sizes 5,9  # subset
//   node puzzle-generator/regen-daily-pool.js --count 200  # bigger pool
//
// Sizes are chosen to cover the live daily floor/ceiling (MIN_PUZZLE_SIZE
// through one beyond) plus the legacy 4×4 file so older builds and
// snapshots stay reproducible. Each size uses `--seed N` so re-running this
// script produces identical output bit-for-bit; if you need a fresh pool,
// pass `--seed-base <n>` to shift every seed.

import { spawnSync } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_SIZES = [4, 5, 6, 7, 8, 9]
const DEFAULT_COUNT = 100
const DEFAULT_SEED_BASE = 0

function parseArgs(argv) {
    const args = { sizes: DEFAULT_SIZES, count: DEFAULT_COUNT, seedBase: DEFAULT_SEED_BASE }
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a === '--sizes') {
            args.sizes = argv[++i].split(',').map((n) => parseInt(n, 10))
        } else if (a === '--count') {
            args.count = parseInt(argv[++i], 10)
        } else if (a === '--seed-base') {
            args.seedBase = parseInt(argv[++i], 10)
        }
    }
    return args
}

function main() {
    const { sizes, count, seedBase } = parseArgs(process.argv.slice(2))
    const dataDir = resolve(__dirname, '../data')
    const generator = resolve(__dirname, 'generate.js')

    console.log(`Regenerating daily pool — sizes: ${sizes.join(', ')}, count/size: ${count}, seedBase: ${seedBase}`)

    for (const n of sizes) {
        const out = resolve(dataDir, `valid_puzzles_${n}.json`)
        const seed = seedBase + n
        console.log(`\n→ size ${n} (seed ${seed}) → ${out}`)
        const result = spawnSync(
            'node',
            [generator, '--n', String(n), '--count', String(count), '--out', out, '--seed', String(seed)],
            { stdio: 'inherit' }
        )
        if (result.status !== 0) {
            console.error(`Failed to generate size ${n} (exit ${result.status})`)
            process.exit(result.status ?? 1)
        }
    }

    console.log('\nDaily pool regenerated.')
}

main()
