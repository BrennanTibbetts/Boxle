/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Minimal Google Identity Services typings — covers only the surface we use.
interface GsiCredentialResponse {
    credential: string
}

interface GsiInitConfig {
    client_id: string
    callback: (response: GsiCredentialResponse) => void
    nonce?: string
    auto_select?: boolean
    use_fedcm_for_prompt?: boolean
}

interface GsiButtonConfig {
    type?: 'standard' | 'icon'
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    width?: number
    locale?: string
}

interface Window {
    google?: {
        accounts: {
            id: {
                initialize: (config: GsiInitConfig) => void
                renderButton: (parent: HTMLElement, options: GsiButtonConfig) => void
                prompt: () => void
                cancel: () => void
                disableAutoSelect: () => void
            }
        }
    }
}
