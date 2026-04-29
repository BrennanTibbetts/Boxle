import { useEffect, type ReactNode } from 'react'

export function useModalEscape(onClose: () => void, enabled: boolean = true): void {
    useEffect(() => {
        if (!enabled) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose, enabled])
}

interface ModalProps {
    onClose: () => void
    children: ReactNode
    // Existing overlay/card class names used by individual modals so the migration
    // doesn't disturb visual styling — pass the same classes the modal had before.
    overlayClassName: string
    cardClassName: string
}

export default function Modal({ onClose, children, overlayClassName, cardClassName }: ModalProps) {
    useModalEscape(onClose)
    return (
        <div className={overlayClassName} onClick={onClose}>
            <div className={cardClassName} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}
