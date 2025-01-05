import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const Phase = {
    READY: 'ready',
    PLAYING: 'playing',
    ENDED: 'ended'
}

export default create(subscribeWithSelector((set) => {
    return {
        // camera managment
        cameraPosition: [0, 16, 0],
        cameraRotationZ: 0,
        setCameraPosition: (newPosition) => set({ cameraPosition: newPosition }),
        rotateCamera: (times) => set((state) => { 
            const newRotation = state.cameraRotationZ - Math.PI/2 * times
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
                if (state.phase == Phase.ENDED || state.phase == Phase.PLAYING )
                    console.log("restart")
                    state.setLives(3)
                    state.setLevel(1)
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
        level: 1,
        incrementLevel: () => set((state) => {
            const nextLevel = state.level + 1
            console.log('Level: ', nextLevel)
            state.rotateCamera(1)
            return { level: nextLevel }
        }),
        decrementLevel: () => set((state) => {
            const nextLevel = state.level - 1
            console.log('Level: ', nextLevel)
            return { level: nextLevel }
        }),
        setLevel: (level) => {set({level})},

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
        setLives: (lives) => {set({lives})},

        // timer Managment
        startTime: null,
        endTime: null,
    }
}))