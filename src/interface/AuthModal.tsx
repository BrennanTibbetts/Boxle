import { useEffect, useRef, useState } from 'react'
import useUI from '../stores/useUI'
import useAuth from '../stores/useAuth'
import useProfile, { USERNAME_PATTERN } from '../stores/useProfile'
import { useModalEscape } from './Modal'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function waitForGsi(timeoutMs = 6000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve()
        const start = Date.now()
        const interval = setInterval(() => {
            if (window.google?.accounts?.id) {
                clearInterval(interval)
                resolve()
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval)
                reject(new Error('Google Identity Services failed to load'))
            }
        }, 50)
    })
}

// Supabase verifies the ID token's nonce by SHA-256-hashing the raw nonce we
// send on signInWithIdToken and comparing to the hashed nonce we asked Google
// to embed. So: send hashed-hex to Google, raw to Supabase.
async function makeNoncePair(): Promise<{ raw: string; hashedHex: string }> {
    const raw = crypto.randomUUID() + '-' + crypto.randomUUID()
    const bytes = new TextEncoder().encode(raw)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const hashedHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    return { raw, hashedHex }
}

function AppleIcon() {
    return (
        <svg className="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M16.37 12.66c-.02-2.43 1.99-3.6 2.08-3.66-1.13-1.66-2.9-1.88-3.53-1.91-1.5-.15-2.94.88-3.7.88-.78 0-1.95-.86-3.21-.84-1.65.02-3.18.96-4.03 2.44-1.72 2.99-.44 7.4 1.23 9.83.81 1.18 1.78 2.51 3.04 2.46 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.2 2.95-2.39.93-1.37 1.31-2.7 1.33-2.77-.03-.01-2.55-.98-2.5-3.92zM13.94 5.5c.67-.81 1.13-1.94 1-3.07-.97.04-2.15.65-2.85 1.46-.62.71-1.18 1.86-1.03 2.96 1.09.08 2.21-.55 2.88-1.35z" />
        </svg>
    )
}

function UsernameForm() {
    const username = useProfile((s) => s.username)
    const setUsername = useProfile((s) => s.setUsername)
    const [draft, setDraft] = useState(username ?? '')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savedFlash, setSavedFlash] = useState(false)

    useEffect(() => {
        setDraft(username ?? '')
    }, [username])

    const dirty = draft !== (username ?? '')
    const valid = USERNAME_PATTERN.test(draft)

    return (
        <form
            className="auth-username-form"
            onSubmit={async (e) => {
                e.preventDefault()
                if (busy || !dirty || !valid) return
                setBusy(true)
                setError(null)
                try {
                    await setUsername(draft)
                    setSavedFlash(true)
                    setTimeout(() => setSavedFlash(false), 1200)
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Save failed')
                } finally {
                    setBusy(false)
                }
            }}
        >
            <span className="auth-label">{username ? 'Username' : 'Choose a username'}</span>
            <div className="auth-username-row">
                <input
                    className="auth-username-input"
                    value={draft}
                    onChange={(e) => {
                        setError(null)
                        setDraft(e.target.value.toLowerCase())
                    }}
                    placeholder="boxlemaster"
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                />
                <button
                    type="submit"
                    className="hud-btn auth-username-save"
                    disabled={busy || !dirty || !valid}
                >
                    {busy ? '…' : savedFlash ? '✓' : 'Save'}
                </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            {!username && !error && (
                <div className="auth-hint">3–20 chars · a–z · 0–9 · underscore</div>
            )}
        </form>
    )
}

export default function AuthModal() {
    const open = useUI((s) => s.authOpen)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const status = useAuth((s) => s.status)
    const user = useAuth((s) => s.user)
    const signInWithGoogleIdToken = useAuth((s) => s.signInWithGoogleIdToken)
    const signInWithApple = useAuth((s) => s.signInWithApple)
    const signOut = useAuth((s) => s.signOut)
    const [error, setError] = useState<string | null>(null)
    const [appleBusy, setAppleBusy] = useState(false)
    const googleBtnRef = useRef<HTMLDivElement | null>(null)

    const onClose = () => setAuthOpen(false)
    useModalEscape(onClose, open)

    useEffect(() => {
        if (!open) return
        if (status !== 'unauthenticated') return
        if (!googleBtnRef.current) return

        let cancelled = false
        const target = googleBtnRef.current

        ;(async () => {
            try {
                await waitForGsi()
                if (cancelled) return
                const { raw, hashedHex } = await makeNoncePair()
                if (cancelled) return

                window.google!.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    nonce: hashedHex,
                    callback: async (response) => {
                        try {
                            await signInWithGoogleIdToken(response.credential, raw)
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Sign-in failed')
                        }
                    },
                })

                target.replaceChildren()
                window.google!.accounts.id.renderButton(target, {
                    theme: 'filled_black',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 272,
                })
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Google sign-in unavailable')
            }
        })()

        return () => {
            cancelled = true
        }
    }, [open, status, signInWithGoogleIdToken])

    const handleApple = async () => {
        if (appleBusy) return
        setAppleBusy(true)
        setError(null)
        try {
            await signInWithApple()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed')
            setAppleBusy(false)
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
                        <UsernameForm />
                        <div className="auth-account-row">
                            <span className="auth-label">Signed in as</span>
                            <span className="auth-email">{user.email}</span>
                        </div>
                        <button className="hud-btn auth-action-btn" onClick={() => signOut()}>Sign out</button>
                    </>
                ) : (
                    <>
                        <p className="auth-blurb">Sign in to save your stats across devices.</p>
                        <div ref={googleBtnRef} className="gsi-btn-host" />
                        <button
                            type="button"
                            className="oauth-btn oauth-btn-apple"
                            onClick={handleApple}
                            disabled={appleBusy}
                        >
                            <AppleIcon />
                            <span>{appleBusy ? 'Connecting…' : 'Continue with Apple'}</span>
                        </button>
                        {error && <div className="auth-error">{error}</div>}
                    </>
                )}
            </div>
        </aside>
    )
}
