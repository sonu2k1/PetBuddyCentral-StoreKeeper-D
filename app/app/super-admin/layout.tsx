import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarNav, LogoutButton } from '@/components/layout/SidebarNav'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/super-admin/dashboard', icon: '📊' },
    { label: 'Stores', href: '/super-admin/stores', icon: '🏪' },
    { label: 'Products', href: '/super-admin/products', icon: '📦' },
    { label: 'Analytics', href: '/super-admin/analytics', icon: '📈' },
    { label: 'Audit Log', href: '/super-admin/audit', icon: '📜' },
    { label: 'Users', href: '/super-admin/users', icon: '👥' },
    { label: 'Settings', href: '/super-admin/settings', icon: '⚙️' },
]

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        redirect('/login')
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="PetBuddyCentral" />
                    <div>
                        <div className="sidebar-logo-text">PetBuddyCentral</div>
                        <div className="sidebar-logo-sub">Super Admin</div>
                    </div>
                </div>

                <SidebarNav items={NAV_ITEMS} sectionTitle="Navigation" />

                <div className="sidebar-footer">
                    <div
                        className="sidebar-item"
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--glass-radius-sm)',
                            background: 'var(--glass-bg)',
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>🏢</span>
                        <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                {session.user.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                {(session.user as any).orgName}
                            </div>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            <main className="main-content">{children}</main>
        </div>
    )
}
