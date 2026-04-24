interface IconProps {
    size?: number
}

export function BoxleIcon({ size = 18 }: IconProps) {
    return (
        <svg className="box-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
                <radialGradient id="boxle-grad" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#fffbd0" />
                    <stop offset="55%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#c89a0e" />
                </radialGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#boxle-grad)" />
            <path
                d="M12 6 L13.5 10.5 L18 12 L13.5 13.5 L12 18 L10.5 13.5 L6 12 L10.5 10.5 Z"
                fill="#fffbe0"
                opacity="0.9"
            />
        </svg>
    )
}

export function MarkIcon({ size = 18 }: IconProps) {
    return (
        <svg className="box-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="#2c2c2f" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <circle cx="12" cy="12" r="2.4" fill="#b8b8bd" />
        </svg>
    )
}

export function LockIcon({ size = 18 }: IconProps) {
    return (
        <svg className="box-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="#1e1e21" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <circle cx="12" cy="12" r="4.8" fill="#8a8a90" />
        </svg>
    )
}
