import { generateBoard } from './src/generator/generate.ts'

const SIZE = parseInt(process.argv[2] ?? '16', 10)
const RUNS = parseInt(process.argv[3] ?? '50', 10)
const BUDGET_MS = parseInt(process.argv[4] ?? '60000', 10)

console.log(`Generating ${RUNS} puzzles at size ${SIZE} (budget ${BUDGET_MS}ms each)\n`)

const timings: number[] = []
let successes = 0
let failures = 0

for (let i = 0; i < RUNS; i++) {
    const start = performance.now()
    const board = generateBoard(SIZE, undefined, BUDGET_MS)
    const elapsed = performance.now() - start
    timings.push(elapsed)
    if (board) successes++
    else failures++
    process.stdout.write(`\r  run ${i + 1}/${RUNS}  ${elapsed.toFixed(0)}ms  ${board ? 'ok' : 'FAIL'}    `)
}
console.log('\n')

const sorted = [...timings].sort((a, b) => a - b)
const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
const mean = timings.reduce((a, b) => a + b, 0) / timings.length

console.log(`Results for size ${SIZE} (${RUNS} runs):`)
console.log(`  success:  ${successes}/${RUNS}  (${((successes / RUNS) * 100).toFixed(0)}%)`)
console.log(`  failed:   ${failures}`)
console.log(`  min:      ${sorted[0].toFixed(0)}ms`)
console.log(`  p25:      ${pct(0.25).toFixed(0)}ms`)
console.log(`  p50:      ${pct(0.50).toFixed(0)}ms`)
console.log(`  p75:      ${pct(0.75).toFixed(0)}ms`)
console.log(`  p90:      ${pct(0.90).toFixed(0)}ms`)
console.log(`  p99:      ${pct(0.99).toFixed(0)}ms`)
console.log(`  max:      ${sorted[sorted.length - 1].toFixed(0)}ms`)
console.log(`  mean:     ${mean.toFixed(0)}ms`)
