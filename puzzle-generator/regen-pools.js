// Builds pre-generated puzzle pools for the PAID size range (9×9–18×18),
// driven by the canonical generate.js. These pools are served from Supabase
// at runtime (see boxle-backend puzzle_pools table) — they are NOT bundled in
// the client, so the bundle stays small and the content is server-gated.
//
// Free sizes (5×5–8×8) are NOT generated here: the client reuses the existing
// daily pools (data/valid_puzzles_5..8.json) as the bundled free-tier pools
// (see data/pools.js). Pass --sizes to override the range if you need to.
//
// This is an offline / CI job, not a per-player cost. Nobody is watching, so
// it throws a generous per-attempt budget at the slow large sizes and retries
// failures. The budget fix in generate.js (--budget) guarantees a single
// attempt can't hang the whole build.
//
// Usage:
//   node puzzle-generator/regen-pools.js                 # paid range, default counts
//   node puzzle-generator/regen-pools.js --sizes 9,10    # subset
//   node puzzle-generator/regen-pools.js --count 100     # uniform count override
//   node puzzle-generator/regen-pools.js --jobs 4        # build N sizes concurrently
//   node puzzle-generator/regen-pools.js --upload        # push results to Supabase
//
// Upload reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the environment
// (source boxle-backend/.env first). It replaces all rows for each generated
// size — pools grow by re-running with a higher --count, not by appending.

import { spawn } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { cpus } from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Paid range. Free sizes (<=8) are bundled from the daily pools, not built here.
const DEFAULT_SIZES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const DEFAULT_SEED_BASE = 0
const DEFAULT_BUDGET_MS = 4000
const DEFAULT_JOBS = Math.max(1, cpus().length - 1)

// Per-size pool depth. Infinite tops out at 12×12 and is replayed heavily, so
// 9–12 want deep pools for variety. 13–18 are Library-only (a fixed finite
// ladder), so a few batches' worth of rotation is plenty.
function defaultCountForSize(n) {
    return n <= 12 ? 200 : 50
}

function parseArgs(argv) {
    const args = {
        sizes: DEFAULT_SIZES,
        count: null,
        seedBase: DEFAULT_SEED_BASE,
        budget: DEFAULT_BUDGET_MS,
        jobs: DEFAULT_JOBS,
        outDir: resolve(__dirname, 'generated-pools'),
        upload: false,
    }
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a === '--sizes') args.sizes = argv[++i].split(',').map((n) => parseInt(n, 10))
        else if (a === '--count') args.count = parseInt(argv[++i], 10)
        else if (a === '--seed-base') args.seedBase = parseInt(argv[++i], 10)
        else if (a === '--budget') args.budget = parseInt(argv[++i], 10)
        else if (a === '--jobs') args.jobs = parseInt(argv[++i], 10)
        else if (a === '--out-dir') args.outDir = resolve(process.cwd(), argv[++i])
        else if (a === '--upload') args.upload = true
    }
    return args
}

function poolPath(outDir, n) {
    return resolve(outDir, `pool_${n}.json`)
}

// Spawn one generate.js per size; resolve when it exits.
function generateSize(generator, n, count, seed, budget, outPath) {
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(
            'node',
            [
                generator,
                '--n', String(n),
                '--count', String(count),
                '--out', outPath,
                '--seed', String(seed),
                '--budget', String(budget),
            ],
            { stdio: ['ignore', 'ignore', 'inherit'] }
        )
        child.on('exit', (code) => {
            if (code === 0) resolvePromise()
            else rejectPromise(new Error(`size ${n} failed (exit ${code})`))
        })
        child.on('error', rejectPromise)
    })
}

// Run `tasks` (thunks returning promises) with at most `limit` in flight.
async function runPool(tasks, limit) {
    let next = 0
    const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
        while (next < tasks.length) {
            const i = next++
            await tasks[i]()
        }
    })
    await Promise.all(workers)
}

async function uploadPools(sizes, outDir) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        console.error(
            '\nUpload skipped: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
            '(source boxle-backend/.env) before passing --upload.'
        )
        process.exit(1)
    }
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(url, key, { auth: { persistSession: false } })

    for (const n of sizes) {
        const path = poolPath(outDir, n)
        if (!existsSync(path)) {
            console.warn(`  upload: no file for size ${n}, skipping`)
            continue
        }
        const entries = JSON.parse(readFileSync(path, 'utf8'))
        const rows = entries.map((e, idx) => ({ size: n, idx, board: e.Board }))

        // Replace the whole pool for this size: clear, then insert in chunks
        // (Supabase caps payload size, so batch the inserts).
        const del = await admin.from('puzzle_pools').delete().eq('size', n)
        if (del.error) throw del.error
        for (let i = 0; i < rows.length; i += 500) {
            const chunk = rows.slice(i, i + 500)
            const { error } = await admin.from('puzzle_pools').insert(chunk)
            if (error) throw error
        }
        console.log(`  upload: size ${n} → ${rows.length} rows`)
    }
}

async function main() {
    const { sizes, count, seedBase, budget, jobs, outDir, upload } = parseArgs(process.argv.slice(2))
    const generator = resolve(__dirname, 'generate.js')
    mkdirSync(outDir, { recursive: true })

    console.log(
        `Building puzzle pools — sizes: ${sizes.join(', ')}, ` +
        `budget/attempt: ${budget}ms, jobs: ${jobs}, outDir: ${outDir}`
    )

    const tasks = sizes.map((n) => async () => {
        const c = count ?? defaultCountForSize(n)
        const seed = seedBase + n
        const out = poolPath(outDir, n)
        console.log(`→ size ${n}: ${c} puzzles (seed ${seed}) → ${out}`)
        await generateSize(generator, n, c, seed, budget, out)
    })

    await runPool(tasks, jobs)
    console.log('\nPool generation complete.')

    if (upload) {
        console.log('\nUploading paid-size pools to Supabase…')
        await uploadPools(sizes, outDir)
        console.log('Upload complete.')
    } else {
        console.log('Pass --upload to push these pools to Supabase puzzle_pools.')
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
