import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import useAuth from './useAuth'

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

interface ProfileState {
    username: string | null
    loaded: boolean
    setUsername: (next: string) => Promise<void>
}

const useProfile = create<ProfileState>(() => ({
    username: null,
    loaded: false,
    setUsername: async (next) => {
        const userId = useAuth.getState().user?.id
        if (!userId) throw new Error('Not signed in')
        if (!USERNAME_PATTERN.test(next)) {
            throw new Error('Username must be 3–20 chars: a–z, 0–9, _')
        }
        const { error } = await supabase
            .from('profiles')
            .update({ username: next })
            .eq('user_id', userId)
        if (error) {
            // 23505 = unique_violation. Translate to something readable.
            if (error.code === '23505') throw new Error('That username is taken')
            throw new Error(error.message)
        }
        useProfile.setState({ username: next })
    },
}))

async function refetchForCurrent(): Promise<void> {
    const userId = useAuth.getState().user?.id
    if (!userId) {
        useProfile.setState({ username: null, loaded: true })
        return
    }
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userId)
        .single()
    if (error) {
        useProfile.setState({ username: null, loaded: true })
        return
    }
    useProfile.setState({ username: data?.username ?? null, loaded: true })
}

// Refetch whenever the signed-in user changes (sign-in, sign-out, switch).
let lastUserId: string | null = null
useAuth.subscribe((state) => {
    const id = state.user?.id ?? null
    if (id !== lastUserId) {
        lastUserId = id
        void refetchForCurrent()
    }
})

export default useProfile
