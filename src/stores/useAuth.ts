import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated'

interface AuthState {
    user: User | null
    status: AuthStatus
    signInWithGoogleIdToken: (idToken: string, rawNonce: string) => Promise<void>
    signInWithApple: () => Promise<void>
    signOut: () => Promise<void>
}

const useAuth = create<AuthState>(() => ({
    user: null,
    status: 'loading',
    signInWithGoogleIdToken: async (idToken, rawNonce) => {
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
            nonce: rawNonce,
        })
        if (error) throw error
    },
    signInWithApple: async () => {
        // Apple's web flow stays redirect-based — Apple's Services ID setup
        // already gates on a domain you own, so the consent screen shows
        // boxle.click natively (no equivalent of GIS needed). Wired but
        // inert until the Supabase Apple provider is enabled.
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: { redirectTo: window.location.origin },
        })
        if (error) throw error
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },
}))

function applySession(session: { user: User } | null): void {
    useAuth.setState({
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
    })
}

void supabase.auth.getSession().then(({ data }) => applySession(data.session))
supabase.auth.onAuthStateChange((_event, session) => applySession(session))

export default useAuth
