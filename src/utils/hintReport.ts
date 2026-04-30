import { findBestHint, type HintResult } from './hintRules'
import useGame from '../stores/useGame'
import { BoxState, type LevelGrid } from '../types/game'

export interface HintReport {
    timestamp: string
    mode: string
    level: number
    levelIndex: number
    gridSize: number
    lives: number
    mistakes: number
    levelMatrix: number[][]
    answerMatrix: boolean[][]
    grid: LevelGrid
    foundHint: HintResult | null
    note?: string
}

const STORAGE_KEY = 'boxle:hint-reports'

export function captureHintReport(note?: string): HintReport | null {
    const game = useGame.getState()
    const levelIndex = game.currentLevel - 1
    const config = game.levelConfigs[levelIndex]
    const grid = game.levels[levelIndex]
    if (!config || !grid) return null

    return {
        timestamp: new Date().toISOString(),
        mode: game.activeMode,
        level: game.currentLevel,
        levelIndex,
        gridSize: config.levelMatrix.length,
        lives: game.lives,
        mistakes: game.levelMistakes[levelIndex] ?? 0,
        levelMatrix: config.levelMatrix,
        answerMatrix: config.answerMatrix,
        grid,
        foundHint: findBestHint(levelIndex, config.levelMatrix, grid),
        note,
    }
}

export function loadReports(): HintReport[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function saveReport(report: HintReport): HintReport[] {
    const all = loadReports()
    all.push(report)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    return all
}

export function clearReports(): void {
    localStorage.removeItem(STORAGE_KEY)
}

export function downloadJSON(filename: string, data: unknown): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function fileSafeTimestamp(iso: string): string {
    return iso.replace(/[:.]/g, '-')
}

// Auto-capture path for the 💡 button: only records when the hint button was
// pressed, the rule engine returned null, AND the puzzle isn't already solved
// (a solved puzzle legitimately has no available boxes for any rule to fire on).
export async function recordMissingHint(): Promise<void> {
    const game = useGame.getState()
    const levelIndex = game.currentLevel - 1
    const grid = game.levels[levelIndex]
    const config = game.levelConfigs[levelIndex]
    if (!grid || !config) return

    const n = config.levelMatrix.length
    let boxleCount = 0
    for (const row of grid) for (const s of row) if (s === BoxState.BOXLE) boxleCount++
    if (boxleCount >= n) return

    const report = captureHintReport('auto: hint button pressed but no hint returned')
    if (!report || report.foundHint) return

    saveReport(report)
    const filename = `boxle-hint-report-${report.mode}-L${report.level}-${fileSafeTimestamp(report.timestamp)}.json`
    const savedPath = await postReportToRepo(filename, report)
    console.warn(
        savedPath
            ? `[hint-report] Auto-captured missing hint → ${savedPath}`
            : '[hint-report] Auto-capture: dev endpoint unreachable; saved to localStorage only',
        report,
    )
}

// Posts to the dev-server middleware in vite.config.ts, which writes the
// payload into the gitignored `hint-reports/` folder at the project root.
// Returns the saved relative path on success, null on failure.
export async function postReportToRepo(filename: string, data: unknown): Promise<string | null> {
    try {
        const res = await fetch('/__hint-report', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ filename, data }),
        })
        if (!res.ok) return null
        const json = await res.json() as { ok?: boolean; path?: string }
        return json.path ?? null
    } catch {
        return null
    }
}
