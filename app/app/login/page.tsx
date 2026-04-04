'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ROLE_DASHBOARDS: Record<string, string> = {
    SUPER_ADMIN: '/super-admin/dashboard',
    FRANCHISE_OWNER: '/franchise/dashboard',
    STORE_MANAGER: '/store/dashboard',
}

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
                setLoading(false)
                return
            }

            // Force a server-side re-evaluation — middleware will redirect to the correct dashboard
            router.refresh()
            // Small delay to let the session cookie propagate, then navigate
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Fetch session to get role for redirect
            const res = await fetch('/api/auth/session')
            const session = await res.json()
            const role = session?.user?.role
            const dashboard = ROLE_DASHBOARDS[role] || '/'
            router.push(dashboard)
        } catch {
            setError('An unexpected error occurred')
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <img src="/logo.png" alt="PetBuddyCentral" />
                    <h1>PetBuddyCentral</h1>
                    <p>Store Keeper</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <div className="input-group">
                        <label className="input-label" htmlFor="email">
                            Email Address
                        </label>
                        <div className="input-with-icon">
                            <svg
                                className="input-icon"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="buddy@petbuddycentral.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="password">
                            Password
                        </label>
                        <div className="input-with-icon">
                            <svg
                                className="input-icon"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        animation: 'spin 1s linear infinite',
                                    }}
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Signing in…
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className="login-divider">Demo Accounts</div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'var(--glass-bg)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                setEmail('admin@petbuddycentral.com')
                                setPassword('admin123')
                            }}
                        >
                            <span>
                                <span className="badge badge-teal">Super Admin</span>
                            </span>
                            <span>admin@petbuddycentral.com</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'var(--glass-bg)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                setEmail('owner@petbuddycentral.com')
                                setPassword('owner123')
                            }}
                        >
                            <span>
                                <span className="badge badge-blue">Franchise Owner</span>
                            </span>
                            <span>owner@petbuddycentral.com</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'var(--glass-bg)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                setEmail('manager@petbuddycentral.com')
                                setPassword('manager123')
                            }}
                        >
                            <span>
                                <span className="badge badge-coral">Store Manager</span>
                            </span>
                            <span>manager@petbuddycentral.com</span>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
        </div>
    )
}
