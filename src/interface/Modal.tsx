import { useEffect, type ReactNode } from 'react'
import { ModalOverlay, GlassCard } from './ui'
import type { ComponentProps } from 'react'

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
    overlayProps?: ComponentProps<typeof ModalOverlay>
    cardProps?: ComponentProps<typeof GlassCard>
}

export default function Modal({ onClose, children, overlayProps, cardProps }: ModalProps) {
    useModalEscape(onClose)
    return (
        <ModalOverlay onPress={onClose} {...overlayProps}>
            <GlassCard onPress={(e) => e.stopPropagation()} {...cardProps}>
                {children}
            </GlassCard>
        </ModalOverlay>
    )
}
