import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarNav, LogoutButton } from '@/components/layout/SidebarNav'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/franchise/dashboard', icon: '📊' },
    { label: 'Inventory', href: '/franchise/inventory', icon: '📦' },
    { label: 'Billing', href: '/franchise/billing', icon: '🧾' },
    { label: 'Customers', href: '/franchise/customers', icon: '👤' },
    { label: 'Purchase Orders', href: '/franchise/purchase-orders', icon: '📋' },
    { label: 'Reports', href: '/franchise/reports', icon: '📈' },
    { label: 'Settings', href: '/franchise/settings', icon: '⚙️' },
]

export default async function FranchiseLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user || (session.user as any).role !== 'FRANCHISE_OWNER') {
        redirect('/login')
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="PetBuddyCentral" />
                    <div>
                        <div className="sidebar-logo-text">PetBuddyCentral</div>
                        <div className="sidebar-logo-sub">Franchise Owner</div>
                    </div>
                </div>

                <SidebarNav items={NAV_ITEMS} sectionTitle="Store Management" />

                <div className="sidebar-footer">
                    <div
                        className="sidebar-item"
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--glass-radius-sm)',
                            background: 'var(--glass-bg)',
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>🏪</span>
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
                                {(session.user as any).storeName || (session.user as any).orgName}
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
