# Boxle

A daily 3D Star Battle puzzle game built with React and Three.js. Each day presents a fresh sequence of puzzles across multiple grid sizes.

---

## Star Battle Rules

Star Battle (also called "Two Not Touch") is a logic puzzle played on an N×N grid divided into N regions.

**Goal:** Place exactly S stars per row, per column, and per region.

**Rules:**
1. Every row must contain exactly S stars.
2. Every column must contain exactly S stars.
3. Every region (outlined area) must contain exactly S stars.
4. No two stars may touch — not even diagonally.

The puzzle has a unique solution derivable through logic alone.

**Common variants:**

| Stars (S) | Typical grid size |
|-----------|------------------|
| 1         | 8×8              |
| 2         | 10×10            |
| 3         | 14×14            |

---

## Running the Game

```
npm install
npm run dev
```

Opens at `http://localhost:3000`. The daily puzzle sequence is seeded from the current date, so every player sees the same puzzles each day.

---

## Puzzle Generator

The generator lives in `puzzle-generator/` and produces valid, uniquely-solvable Star Battle puzzles procedurally.

### Usage

```bash
cd puzzle-generator
node generate.js --n <gridSize> [options]
```

| Flag      | Default | Description |
|-----------|---------|-------------|
| `--n`     | required | Grid size. S=1 supports 4–11; S=2 requires 8–11 |
| `--s`     | `1`     | Stars per row/column/region |
| `--count` | `10`    | Number of puzzles to generate |
| `--out`   | auto    | Output file path |
| `--seed`  | random  | Master PRNG seed (same seed → same puzzles) |
| `--append`| false   | Append to existing file instead of overwriting |

**Examples:**

```bash
# Generate 50 standard 8×8 puzzles
node generate.js --n 8 --count 50

# Generate 2-star 10×10 puzzles, reproducible
node generate.js --n 10 --s 2 --count 20 --seed 42

# Append to an existing puzzle file
node generate.js --n 6 --count 100 --out ../data/valid_puzzles_6.json --append
```

Output goes to `generated-puzzles/` by default.

### How the algorithm works

The generator is fully procedural — it never creates a random board and checks validity. Instead:

1. **Star placement** — Stars are placed row by row via backtracking. Every star placed satisfies the row, column, and adjacency constraints by construction.
2. **Region growth** — N connected regions are grown simultaneously from the star seed cells using a randomized BFS. Regions are contiguous by construction.
3. **Uniqueness repair** — The board is iteratively adjusted until only one valid star placement exists. A constraint solver identifies alternative solutions and guides targeted boundary adjustments to eliminate them.

### Data format

Puzzles are stored as a single N×N integer matrix. The encoding is:

- **Regular cell** in region `r` → integer `r`
- **Star cell** in region `r` → string `"r*"`

To decode: if the value is a string ending in `*`, it's a star in that region.

```json
[
  {
    "Board": [[1,1,"2*",0],[1,"0*",0,0],["3*",3,3,0],[3,3,"1*",2]]
  }
]
```
