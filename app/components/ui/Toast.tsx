'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    title?: string
}

interface ToastContextType {
    toast: (t: Omit<Toast, 'id'>) => void
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
}

const COLORS = {
    success: { bg: 'rgba(0, 200, 150, 0.15)', border: 'rgba(0, 200, 150, 0.3)', icon: 'var(--pbc-teal)' },
    error: { bg: 'rgba(255, 107, 107, 0.15)', border: 'rgba(255, 107, 107, 0.3)', icon: 'var(--coral)' },
    warning: { bg: 'rgba(255, 193, 7, 0.15)', border: 'rgba(255, 193, 7, 0.3)', icon: 'var(--warning)' },
    info: { bg: 'rgba(74, 141, 183, 0.15)', border: 'rgba(74, 141, 183, 0.3)', icon: 'var(--pbc-blue)' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((t: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7)
        setToasts((prev) => [...prev, { ...t, id }])
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000)
    }, [])

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const value: ToastContextType = {
        toast: addToast,
        success: (message) => addToast({ type: 'success', message }),
        error: (message) => addToast({ type: 'error', message }),
        warning: (message) => addToast({ type: 'warning', message }),
        info: (message) => addToast({ type: 'info', message }),
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                pointerEvents: 'none',
            }}>
                {toasts.map((t) => {
                    const Icon = ICONS[t.type]
                    const colors = COLORS[t.type]
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: 'var(--space-3) var(--space-4)',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                backdropFilter: 'blur(20px)',
                                borderRadius: '12px',
                                minWidth: '300px',
                                maxWidth: '420px',
                                pointerEvents: 'auto',
                                animation: 'slideIn 0.3s ease',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            }}
                        >
                            <Icon size={18} style={{ color: colors.icon, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                {t.title && <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '2px' }}>{t.title}</div>}
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{t.message}</div>
                            </div>
                            <button
                                onClick={() => remove(t.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )
                })}
            </div>
            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </ToastContext.Provider>
    )
}
