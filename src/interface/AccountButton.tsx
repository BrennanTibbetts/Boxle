import useUI from '../stores/useUI'
import useAuth from '../stores/useAuth'

function PersonIcon() {
    return (
        <svg viewBox="0 0 24 24" className="account-btn-icon" aria-hidden="true">
            <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
        </svg>
    )
}

export default function AccountButton() {
    const open = useUI((s) => s.authOpen)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const status = useAuth((s) => s.status)
    const isSignedIn = status === 'authenticated'

    return (
        <div className="auth-corner">
            <button
                className={`hud-btn account-btn${isSignedIn ? ' signed-in' : ''}${open ? ' active' : ''}`}
                onClick={() => setAuthOpen(!open)}
                title={isSignedIn ? 'Account' : 'Sign in'}
                aria-label={isSignedIn ? 'Account' : 'Sign in'}
            >
                <PersonIcon />
            </button>
        </div>
    )
}
