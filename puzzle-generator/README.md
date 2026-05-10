# puzzle-generator

Standalone Node CLI that generates Boxle puzzles. Used to (re-)create the
daily pool JSONs in [`data/`](../data/) — the curated, version-controlled set
of puzzles that ships with every build.

This is the **canonical, reproducible** generator: web bundles the JSONs at
build time, and a future iOS app will bundle the same JSONs at Xcode build
time. Everyone gets the same daily because everyone reads the same file.

The runtime, in-app generator at [`src/generator/generate.ts`](../src/generator/generate.ts)
is a TypeScript port of this script and is used at runtime for Infinite and
Library puzzles (one-off generation per puzzle, no pool). Keep both in sync
when changing the algorithm.

## Why pre-generate instead of seed-on-the-fly?

Daily puzzles need to be (a) **identical for every player** on a given date,
and (b) **playable offline**. A backend-served algorithm fails (b); a
seeded-runtime-generator approach fails (a) the moment we ship iOS, because
guaranteeing bit-identical output from two different generator
implementations (TypeScript, Swift) is brittle. Bundled JSONs sidestep both
issues.

## Files

- `generate.js` — the CLI itself. Generates puzzles for a single grid size.
- `regen-daily-pool.js` — wrapper that calls `generate.js` for every daily
  size and writes the results to `../data/valid_puzzles_N.json`. Use this
  when you want to refresh the whole pool.

## Quickstart

Regenerate the full daily pool (sizes 4–9, 100 puzzles each, deterministic
per-size seed):

```sh
npm run puzzles:regen-daily
```

Re-running with the same args produces byte-identical output. To generate a
fresh set, pass a different seed-base:

```sh
node puzzle-generator/regen-daily-pool.js --seed-base 100
```

To rebuild only specific sizes or a different count:

```sh
node puzzle-generator/regen-daily-pool.js --sizes 5,6,7 --count 200
```

## Single-size CLI

For one-offs, `generate.js` takes raw flags:

```sh
node puzzle-generator/generate.js --n 7 --count 50 --out ./tmp.json --seed 42
```

| Flag | Default | Notes |
|---|---|---|
| `--n` | _required_ | Grid size (S=1: 4–11, S=2: 8–11) |
| `--s` | `1` | Boxles per row/column/region. Only S=1 ships today (S>1 codepath has known bugs — see `tasks/phase-4-new-modes.md` "Known generator limitation") |
| `--count` | `10` | How many puzzles to produce |
| `--out` | `./generated-puzzles/puzzles_n${N}_s${S}.json` | Output path |
| `--seed` | `Date.now()` | Master PRNG seed; with the same seed and count, output is bit-identical |
| `--append` | `false` | Append to an existing file rather than overwriting |

## Output format

Each file is a JSON array of `{ Board: number-or-string[][] }`. Cells are
encoded with the region id; cells holding the boxle (the answer) are tagged
with a trailing `*`. Example for a 4×4 puzzle with one boxle in the top-left
region:

```json
{
  "Board": [
    ["0*", 0, 1, 1],
    [0, 0, 1, "1*"],
    [2, "2*", 3, 3],
    ["3*", 2, 3, 3]
  ]
}
```

The runtime decoder in [`src/utils/puzzle.ts`](../src/utils/puzzle.ts)
(`decodeBoard`) reads this format into the in-game `levelMatrix` /
`answerMatrix` shape.

## Daily pool conventions

- **Sizes shipped:** the JSONs cover sizes 4–9. The live daily session
  filters to `[MIN_PUZZLE_SIZE..]` at runtime via `useDailyPuzzles.ts`, so
  the active range is 5–9 today (5 puzzles per day).
- **Pool size:** 100 puzzles per size. With one puzzle pulled per size per
  day, this gives ~3 months of unique dailies before any repeat at a given
  size; the cross-size combination keeps the per-day sequence varied for
  much longer.
- **When to regenerate:** if you change the algorithm in `generate.js`, or
  want a larger / fresher pool. Keep `src/generator/generate.ts` in sync
  with any algorithm change so Infinite/Library runtime gen produces the same
  shape of puzzle.
