import { auth } from '@/lib/auth'
import { getOrgSettings } from '@/app/actions/settings'
import { ProfileSettingsClient } from '@/components/profile/ProfileSettingsClient'

export const metadata = { title: 'Settings | PetBuddyCentral' }

export default async function FranchiseSettingsPage() {
    const session = await auth()
    const org = await getOrgSettings()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Settings</h1>
                <span className="badge badge-blue">Franchise Owner</span>
            </header>
            <div className="page-body" style={{ maxWidth: '700px' }}>
                <div className="glass-card" style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏢 Organization</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{org.name}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>GST:</span> <code>{org.gstNumber || '—'}</code></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {org.email || '—'}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {org.phone || '—'}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Website:</span> {org.website || '—'}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Slug:</span> <code>{org.slug}</code></div>
                    </div>
                </div>

                <div className="glass-card" style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📊 Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                        {[
                            { label: 'Stores', value: org._count?.stores, icon: '🏪' },
                            { label: 'Users', value: org._count?.users, icon: '👥' },
                            { label: 'Products', value: org._count?.products, icon: '📦' },
                            { label: 'Customers', value: org._count?.customers, icon: '👤' },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '18px' }}>{s.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{s.value}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card">
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>ℹ️ Note</h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Organization settings can only be modified by the Super Admin. Contact your admin if changes are needed.
                    </p>
                </div>

                <div style={{ marginTop: 'var(--space-8)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>My Profile</h2>
                    <ProfileSettingsClient initialName={session?.user?.name || ''} />
                </div>
            </div>
        </>
    )
}
