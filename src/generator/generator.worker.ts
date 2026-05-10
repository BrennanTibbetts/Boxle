// Off-thread puzzle generator. The synchronous codepath in generate.ts blocks
// the main thread for hundreds of ms at sizes 12+; running it in a worker
// keeps the tab responsive while the next puzzle is being computed.
//
// Protocol is intentionally minimal: one request in, one response out, keyed
// by requestId so the host can ignore stale results without coordinating
// cancellation with the worker (JS can't preempt mid-generation anyway).

import { generateBoard } from './generate'
import { decodeBoard } from '../utils/puzzle'
import type { DecodedBoard } from '../types/puzzle'

interface GenerateRequest {
    type: 'generate'
    requestId: number
    size: number
}

export interface GenerateResponse {
    type: 'result'
    requestId: number
    board: DecodedBoard | null
}

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
    const { type, requestId, size } = event.data
    if (type !== 'generate') return
    const raw = generateBoard(size)
    const board = raw ? decodeBoard(raw) : null
    const response: GenerateResponse = { type: 'result', requestId, board }
    ;(self as DedicatedWorkerGlobalScope).postMessage(response)
}
