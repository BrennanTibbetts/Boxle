import { useState } from 'react'
import useUI from '../stores/useUI'
import useAuth, { type OAuthProvider } from '../stores/useAuth'
import { useModalEscape } from './Modal'

function GoogleIcon() {
    return (
        <svg className="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
    )
}

function AppleIcon() {
    return (
        <svg className="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M16.37 12.66c-.02-2.43 1.99-3.6 2.08-3.66-1.13-1.66-2.9-1.88-3.53-1.91-1.5-.15-2.94.88-3.7.88-.78 0-1.95-.86-3.21-.84-1.65.02-3.18.96-4.03 2.44-1.72 2.99-.44 7.4 1.23 9.83.81 1.18 1.78 2.51 3.04 2.46 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.2 2.95-2.39.93-1.37 1.31-2.7 1.33-2.77-.03-.01-2.55-.98-2.5-3.92zM13.94 5.5c.67-.81 1.13-1.94 1-3.07-.97.04-2.15.65-2.85 1.46-.62.71-1.18 1.86-1.03 2.96 1.09.08 2.21-.55 2.88-1.35z" />
        </svg>
    )
}

export default function AuthModal() {
    const open = useUI((s) => s.authOpen)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const status = useAuth((s) => s.status)
    const user = useAuth((s) => s.user)
    const signInWithProvider = useAuth((s) => s.signInWithProvider)
    const signOut = useAuth((s) => s.signOut)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState<OAuthProvider | null>(null)

    const onClose = () => setAuthOpen(false)
    useModalEscape(onClose, open)

    const handleProvider = async (provider: OAuthProvider) => {
        if (busy) return
        setBusy(provider)
        setError(null)
        try {
            await signInWithProvider(provider)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed')
            setBusy(null)
        }
    }

    return (
        <aside className={`auth-panel${open ? ' open' : ''}`} aria-hidden={!open}>
            <div className="auth-card" onClick={(e) => e.stopPropagation()}>
                <div className="auth-header">
                    <h2 className="auth-title">Account</h2>
                    <button className="auth-close-btn" onClick={onClose} aria-label="Close">×</button>
                </div>

                {status === 'authenticated' && user ? (
                    <>
                        <div className="auth-account-row">
                            <span className="auth-label">Signed in as</span>
                            <span className="auth-email">{user.email}</span>
                        </div>
                        <button className="hud-btn auth-action-btn" onClick={() => signOut()}>Sign out</button>
                    </>
                ) : (
                    <>
                        <p className="auth-blurb">Sign in to save your stats across devices.</p>
                        <button
                            type="button"
                            className="oauth-btn oauth-btn-google"
                            onClick={() => handleProvider('google')}
                            disabled={busy !== null}
                        >
                            <GoogleIcon />
                            <span>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
                        </button>
                        <button
                            type="button"
                            className="oauth-btn oauth-btn-apple"
                            onClick={() => handleProvider('apple')}
                            disabled={busy !== null}
                        >
                            <AppleIcon />
                            <span>{busy === 'apple' ? 'Connecting…' : 'Continue with Apple'}</span>
                        </button>
                        {error && <div className="auth-error">{error}</div>}
                    </>
                )}
            </div>
        </aside>
    )
}
