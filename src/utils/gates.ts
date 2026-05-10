import { GameMode, type GameModeValue } from '../types/game'
import useAuth from '../stores/useAuth'
import usePersistence from '../stores/usePersistence'
import { FREE_INFINITE_MAX_SIZE, FREE_LIBRARY_MAX_SIZE } from '../config/gates'

// `isPremium` is only authoritative when the user is signed in — it comes
// from the server-mirrored profiles.is_premium row that only the service
// role can write. When anonymous, the local field stays false and a
// DevTools flip can never unlock content.
function isPremiumComposed(): boolean {
    if (useAuth.getState().status !== 'authenticated') return false
    return usePersistence.getState().isPremium
}

export function canPlayAt(size: number, mode: GameModeValue): boolean {
    if (mode === GameMode.DAILY) return true
    if (isPremiumComposed()) return true
    if (mode === GameMode.INFINITE) return size <= FREE_INFINITE_MAX_SIZE
    if (mode === GameMode.LIBRARY) return size <= FREE_LIBRARY_MAX_SIZE
    return false
}
