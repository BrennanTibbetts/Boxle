import useUI from '../stores/useUI'
import useAuth from '../stores/useAuth'
import useProfile from '../stores/useProfile'

export default function AccountButton() {
    const open = useUI((s) => s.authOpen)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const status = useAuth((s) => s.status)
    const username = useProfile((s) => s.username)
    const profileLoaded = useProfile((s) => s.loaded)

    const isSignedIn = status === 'authenticated'
    const label = !isSignedIn
        ? 'Sign in'
        : username ?? (profileLoaded ? 'Set username' : '…')

    return (
        <div className="auth-corner">
            <button
                className={`hud-btn account-btn${isSignedIn ? ' signed-in' : ''}${open ? ' active' : ''}`}
                onClick={() => setAuthOpen(!open)}
                aria-label={isSignedIn ? `Account: ${label}` : 'Sign in'}
            >
                <span className="account-btn-label">{label}</span>
                {isSignedIn && <span className="account-btn-status" aria-hidden="true" />}
            </button>
        </div>
    )
}
