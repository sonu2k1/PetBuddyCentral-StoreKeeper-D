'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    maxWidth?: string
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '500px',
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => {
            document.body.style.overflow = 'unset'
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    // Handle click outside
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose()
    }

    if (!isOpen) return null

    return (
        <div
            ref={overlayRef}
            className="modal-overlay animate-in"
            onClick={handleOverlayClick}
            style={{
                zIndex: 50,
            }}
        >
            <div
                className="modal-content animate-in animate-in-slide"
                style={{ maxWidth, width: '100%' }}
            >
                <div className="modal-header">
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '8px' }}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    )
}
