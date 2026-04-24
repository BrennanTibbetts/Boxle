import type { DecodedBoard } from '../types/puzzle'

type GenerateFn = () => DecodedBoard | null

export class PuzzleBuffer {
    private readonly buffer: DecodedBoard[] = []
    private filling: Promise<void> | null = null

    constructor(
        private readonly fillTo: number,
        private readonly generate: GenerateFn,
    ) {}

    size(): number {
        return this.buffer.length
    }

    async take(): Promise<DecodedBoard | null> {
        if (this.buffer.length === 0) {
            this.kickFill()
            await this.filling
        }
        const board = this.buffer.shift() ?? null
        this.kickFill()
        return board
    }

    async preload(): Promise<void> {
        this.kickFill()
        await this.filling
    }

    private kickFill(): void {
        if (this.filling) return
        if (this.buffer.length >= this.fillTo) return
        this.filling = (async () => {
            while (this.buffer.length < this.fillTo) {
                // Yield to the event loop so UI stays responsive during heavier
                // generations (larger N, alternative-solution search).
                await new Promise<void>((resolve) => setTimeout(resolve, 0))
                const board = this.generate()
                if (board) {
                    this.buffer.push(board)
                } else {
                    // Generator returned null — either the seed failed or parameters
                    // are impossible. Stop here; caller can retry by invoking preload.
                    break
                }
            }
            this.filling = null
        })()
    }
}
