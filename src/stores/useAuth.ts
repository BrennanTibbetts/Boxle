import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated'
export type OAuthProvider = 'google' | 'apple'

interface AuthState {
    user: User | null
    status: AuthStatus
    signInWithProvider: (provider: OAuthProvider) => Promise<void>
    signOut: () => Promise<void>
}

const useAuth = create<AuthState>(() => ({
    user: null,
    status: 'loading',
    signInWithProvider: async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin },
        })
        if (error) throw error
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },
}))

// Hydrate from existing session at module load, then keep state in sync with
// every auth event (sign-in, sign-out, token refresh, OAuth callback).
function applySession(session: { user: User } | null): void {
    useAuth.setState({
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
    })
}

void supabase.auth.getSession().then(({ data }) => applySession(data.session))
supabase.auth.onAuthStateChange((_event, session) => applySession(session))

export default useAuth
