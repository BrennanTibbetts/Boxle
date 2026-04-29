import type { GameModeValue } from '../types/game'

// Phase-4 stub: every size in every mode is allowed. Phase 6 swaps in real
// threshold checks against `usePersistence.isPremium` (locally always false;
// authoritative once accounts ship).
export function canPlayAt(_size: number, _mode: GameModeValue): boolean {
    return true
}
