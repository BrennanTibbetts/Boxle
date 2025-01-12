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
        cameraPosition: [0, 50, 0],
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
        levels: [],
        incrementLevel: () => ((state) => {
            const nextLevel = state.currentLevel + 1
            console.log('Next Level: ', nextLevel)
            state.setCurrentLevel(nextLevel)
        }),
        decrementLevel: () => ((state) => {
            const nextLevel = state.currentLevel - 1
            console.log('Next Level: ', nextLevel)
            state.setCurrentLevel(nextLevel)
        }),
        setCurrentLevel: (level, size = 5) => set((state) => {
            console.log(state.currentLevel, " -> ", level)
            if (!state.levels[level - 1]) {
                state.levels[level - 1] = Array(size * size).fill(BoxState.BLANK)
            }
            return { currentLevel: level };
        }),
        getLevelState: (level) => (state) => {
            return state.levels[level - 1] || [];
        },
        updateBoxState: (index, newState) => set((state) => {
            console.log(index, newState);

            const currentLevel = state.currentLevel;
            const levelSize = 4 // Calculate rows/columns
            const updatedLevel = state.levels[currentLevel - 1].map((boxState, i) =>
                i === index ? newState : boxState
            );

            // Check for stars
            if (newState === BoxState.STAR) {
                const starCount = updatedLevel.filter((boxState) => boxState === BoxState.STAR).length;

                console.log(levelSize)
                console.log(`Stars in level ${currentLevel}:`, starCount);
                if (starCount >= levelSize) {
                    console.log(`Level ${currentLevel} complete! Incrementing level.`);
                    state.setCurrentLevel(currentLevel + 1); // Move to the next level
                }
            }

            // Update levels
            const updatedLevels = {
                ...state.levels,
                [currentLevel - 1]: updatedLevel
            };

            return { levels: updatedLevels };
        }),
        getBoxState: (index) => (state) => {
            const levelState = state.levels[state.currentLevel - 1];
            return levelState ? levelState[index] : BoxState.BLANK;
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