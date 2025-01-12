import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const Phase = {
    READY: 'ready',
    PLAYING: 'playing',
    ENDED: 'ended'
}

export const BoxState = {
    BLANK: 'blank',
    LOCK: 'lock',
    MARK: 'mark',
    STAR: 'star'
}

export default create(subscribeWithSelector((set) => {
    return {
        // camera managment
        cameraPosition: [0, 0, 0],
        cameraRotationZ: 0,
        setCameraPosition: (newPosition) => set({ cameraPosition: newPosition }),
        rotateCamera: (times) => set((state) => {
            const newRotation = state.cameraRotationZ - Math.PI / 2 * times
            return { cameraRotationZ: newRotation }
        }),

        // phase managment
        phase: Phase.PLAYING,
        start: () => {
            set((state) => {
                if (state.phase == Phase.READY)
                    console.log('ready')
                return {
                    phase: Phase.PLAYING,
                    startTime: Date.now()
                }
            })
        },
        restart: () => {
            set((state) => {
                if (state.phase == Phase.ENDED || state.phase == Phase.PLAYING)
                    console.log("restart")
                state.setLives(3)
                state.setCurrentLevel(1)
                return { phase: Phase.READY }
            })
        },
        end: () => {
            set((state) => {
                if (state.phase == 'playing')
                    state.restart()
                return {
                    phase: 'ended',
                    startTime: Date.now()
                }
            })
        },

        // level management
        currentLevel: 1,
        levels: {},
        populateLevels: (boardLengths) => set(() => {
            const levels = boardLengths.map((length) => {
                return Array.from({ length }, () => Array.from({ length }, () => BoxState.BLANK))
            })
            console.log("Populated Levels:", levels)
            return { levels }
        }),
        getLevelState: (level) => (state) => {
            return state.levels[level - 1] || []
        },
        updateBoxState: (row, col, newState) => set((state) => {
            const currentLevel = state.currentLevel
            let nextLevel = currentLevel
            const levelState = state.levels[currentLevel - 1]

            // Update the specific cell in the row
            const updatedRow = levelState[row].map((boxState, index) =>
                index === col ? newState : boxState
            )

            // Update the specific row in the level
            const updatedLevel = levelState.map((rowData, index) =>
                index === row ? updatedRow : rowData
            )

            // Check for stars
            if (newState === BoxState.STAR) {
                const starCount = updatedLevel.flat().filter((boxState) => boxState === BoxState.STAR).length
                const totalStars = updatedLevel.length// Total cells in a square grid

                console.log(`Stars in level ${currentLevel}: ${starCount}/${totalStars}`)
                if (starCount >= totalStars) {
                    console.log(`Level ${currentLevel} complete!`)
                    nextLevel = currentLevel + 1
                }
            }

            // Update levels (as an array)
            const updatedLevels = state.levels.map((level, index) =>
                index === currentLevel - 1 ? updatedLevel : level
            )

            if (nextLevel > state.levels.length) {
                nextLevel = currentLevel
                console.log("All Levels Completed.")
            }

            console.log("Box", row, col, "->", newState)
            return { levels: updatedLevels, currentLevel: nextLevel }
        }),
        getBoxState: (row, col) => (state) => {
            const levelState = state.levels[state.currentLevel - 1]
            return levelState && levelState[row] ? levelState[row][col] : BoxState.BLANK
        },

        // lives Management
        lives: 3,
        incrementLives: () => set((state) => {
            const newLifeCount = state.lives + 1
            console.log('Lives: ', newLifeCount)
            return { lives: newLifeCount }
        }),
        decrementLives: () => set((state) => {
            const newLifeCount = state.lives - 1
            console.log('Lives: ', newLifeCount)
            if (newLifeCount == 0) {
                state.end()
                return { lives: 3 }
            }
            return { lives: newLifeCount }
        }),
        setLives: (lives) => { set({ lives }) },

        // timer Managment
        startTime: null,
        endTime: null,
    }
}))