import useModifierKey from './useModifierKey'

export default function useAltKey(): boolean {
    return useModifierKey('Alt')
}
