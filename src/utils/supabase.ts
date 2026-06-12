import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy client: @supabase/supabase-js is ~50KB gzipped (including realtime and
// storage modules the app never calls) and every consumer is already async,
// so the SDK loads as its own chunk off the boot-critical path. The promise
// is cached — createClient runs once, on first use.
let clientPromise: Promise<SupabaseClient> | null = null

export function getSupabase(): Promise<SupabaseClient> {
    if (!clientPromise) {
        clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
            const url = import.meta.env.VITE_SUPABASE_URL
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

            if (!url || !anonKey) {
                throw new Error(
                    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in values from the Supabase dashboard.'
                )
            }

            return createClient(url, anonKey)
        })
    }
    return clientPromise
}
