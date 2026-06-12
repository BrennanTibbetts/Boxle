// Production stand-in for the leva dev panel, swapped in via resolve.alias
// in vite.config.ts (prod builds only). leva and its dependency tree
// (stitches, radix, react-dropzone, react-colorful…) are ~55KB gzipped of
// tooling that is hidden-but-bundled in prod. useControls here returns each
// schema entry's default value and replays onChange(default) once on mount,
// matching the initial writes the live panel performs; buttons are dev
// affordances and never fire.
//
// Supported schema shapes (everything the app uses — see the leva survey in
// the perf-audit notes): primitives, { value, ...settings, onChange? },
// folder({...}), button(fn). Selects/images/plugins are NOT handled — if a
// dev panel grows one, extend this stub alongside it.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'

const BUTTON = Symbol('leva-stub-button')
const FOLDER = Symbol('leva-stub-folder')

type Schema = Record<string, any>

export function button(fn: (...args: any[]) => void): any {
    return { [BUTTON]: fn }
}

export function folder(schema: Schema, _settings?: any): any {
    return { [FOLDER]: schema }
}

export function Leva(_props: any): null {
    return null
}

function collect(schema: Schema, values: Record<string, any>, onChanges: Array<() => void>) {
    for (const key of Object.keys(schema)) {
        const entry = schema[key]
        if (entry && typeof entry === 'object') {
            if (FOLDER in entry) {
                collect(entry[FOLDER], values, onChanges)
                continue
            }
            if (BUTTON in entry) continue
            if ('value' in entry) {
                values[key] = entry.value
                if (typeof entry.onChange === 'function') {
                    onChanges.push(() => entry.onChange(entry.value))
                }
                continue
            }
        }
        values[key] = entry
    }
}

export function useControls(nameOrSchema: string | Schema, maybeSchema?: Schema): any {
    const [state] = useState(() => {
        const schema = typeof nameOrSchema === 'string' ? (maybeSchema ?? {}) : nameOrSchema
        const values: Record<string, any> = {}
        const onChanges: Array<() => void> = []
        collect(schema, values, onChanges)
        return { values, onChanges }
    })
    const replayed = useRef(false)
    useEffect(() => {
        if (replayed.current) return
        replayed.current = true
        for (const replay of state.onChanges) replay()
    }, [state])
    return state.values
}
