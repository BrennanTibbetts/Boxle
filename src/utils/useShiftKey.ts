import useModifierKey from './useModifierKey'

export default function useShiftKey(): boolean {
    return useModifierKey('Shift')
}
