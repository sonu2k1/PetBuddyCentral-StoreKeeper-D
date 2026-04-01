import { auth } from '@/lib/auth'
import { getStoreSettings } from '@/app/actions/settings'
import { ProfileSettingsClient } from '@/components/profile/ProfileSettingsClient'

export const metadata = { title: 'Settings | PetBuddyCentral' }

export default async function StoreSettingsPage() {
    const session = await auth()
    const storeId = (session?.user as any)?.storeId
    if (!storeId) {
        return (
            <div className="page-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <h2>No store assigned</h2>
                <p style={{ color: 'var(--text-muted)' }}>Contact your admin to be assigned to a store.</p>
            </div>
        )
    }

    const store = await getStoreSettings()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Store Settings</h1>
                <span className="badge badge-warning">Store Manager</span>
            </header>
            <div className="page-body" style={{ maxWidth: '700px' }}>
                {/* Store Info */}
                <div className="glass-card" style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏪 Store Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{store.name}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Code:</span> <code style={{ color: 'var(--pbc-teal)' }}>{store.code}</code></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Address:</span> {store.address}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>City:</span> {store.city}, {store.state}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Pincode:</span> {store.pincode}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {store.phone}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge ${store.isActive ? 'badge-success' : 'badge-danger'}`}>{store.isActive ? 'Active' : 'Inactive'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>GST:</span> <code>{store.gstNumber || store.org?.gstNumber || '—'}</code></div>
                    </div>
                </div>

                {/* Store Stats */}
                <div className="glass-card" style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📊 Store Stats</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                        {[
                            { label: 'Staff', value: store._count?.users || 0, icon: '👥' },
                            { label: 'Invoices', value: store._count?.invoices || 0, icon: '🧾' },
                            { label: 'Products', value: store._count?.inventory || 0, icon: '📦' },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '18px' }}>{s.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{s.value}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Organization */}
                <div className="glass-card">
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>🏢 Organization</h3>
                    <div style={{ fontSize: 'var(--text-sm)' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Org:</span> <strong>{store.org?.name}</strong></div>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                        Store settings are managed by your Franchise Owner or Super Admin. Contact them for changes.
                    </p>
                </div>

                <div style={{ marginTop: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>My Profile</h2>
                    <ProfileSettingsClient initialName={session?.user?.name || ''} />
                </div>
            </div>
        </>
    )
}
