import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '../utils/supabase'
import { flushPendingPush, runSync } from '../utils/sync'

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated'

interface AuthState {
    user: User | null
    status: AuthStatus
    signInWithGoogleIdToken: (idToken: string, rawNonce: string) => Promise<void>
    signInWithApple: () => Promise<void>
    signInWithEmail: (email: string) => Promise<void>
    signOut: () => Promise<void>
}

const useAuth = create<AuthState>(() => ({
    user: null,
    status: 'loading',
    signInWithGoogleIdToken: async (idToken, rawNonce) => {
        const supabase = await getSupabase()
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
        const supabase = await getSupabase()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: { redirectTo: window.location.origin },
        })
        if (error) throw error
    },
    signInWithEmail: async (email) => {
        // Magic-link flow: Supabase emails a one-click link. Clicking it
        // returns the user to `emailRedirectTo` already authenticated, at
        // which point onAuthStateChange fires SIGNED_IN and the rest of the
        // sign-in plumbing (sync, profile fetch) kicks in normally.
        const supabase = await getSupabase()
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
    },
    signOut: async () => {
        // Flush any debounced sync push first — once supabase clears the JWT,
        // RLS will reject writes to the (now ex-)user's profile row.
        await flushPendingPush()
        const supabase = await getSupabase()
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },
}))

// Tracks the user id we last kicked sync for, so we only run sync on actual
// sign-in transitions — not on every TOKEN_REFRESHED event from supabase.
let lastSyncedUserId: string | null = null

function applySession(session: { user: User } | null): void {
    useAuth.setState({
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
    })
    const id = session?.user.id ?? null
    if (id !== lastSyncedUserId) {
        lastSyncedUserId = id
        if (id) void runSync(id)
    }
}

// The SDK chunk starts fetching immediately at boot (so session restore isn't
// gated on user action) but off the critical render path — the game is
// playable signed-out while this resolves.
void getSupabase()
    .then((supabase) => {
        void supabase.auth.getSession().then(({ data }) => applySession(data.session))
        supabase.auth.onAuthStateChange((_event, session) => applySession(session))
    })
    .catch((err) => {
        console.error('[auth] supabase client failed to load', err)
        useAuth.setState({ status: 'unauthenticated' })
    })

export default useAuth
