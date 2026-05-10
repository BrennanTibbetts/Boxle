// Min/max grid size used across every mode (Daily, Infinite, Library).
// Two knobs — change these to feel-tune the floor and ceiling without
// hunting through the run stores or the daily pool.
//
// MIN read by:
//   - INFINITE_START_SIZE in src/stores/useInfiniteRun.ts
//   - LIBRARY_MIN_SIZE in src/stores/useLibraryRun.ts
//   - initialLibraryProgress.unlockedMaxSize in src/stores/usePersistence.ts
//   - useDailyPuzzles in src/hooks/useDailyPuzzles.ts (filters the daily pool)
//
// MAX read by:
//   - INFINITE_MAX_SIZE in src/stores/useInfiniteRun.ts (paid ceiling)
//   - LIBRARY_MAX_SIZE in src/stores/useLibraryRun.ts (paid ceiling)
//
// Daily pool (data/puzzles.js) carries sizes 4..8; raising MIN above 4
// just drops smaller pools at runtime, so daily ends up with fewer levels
// per session unless larger pools are added.
export const MIN_PUZZLE_SIZE = 5
export const MAX_PUZZLE_SIZE = 18
