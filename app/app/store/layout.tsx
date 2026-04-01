import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarNav, LogoutButton } from '@/components/layout/SidebarNav'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/store/dashboard', icon: '📊' },
    { label: 'POS', href: '/store/pos', icon: '🧾', badge: 'Primary' },
    { label: 'Inventory', href: '/store/inventory', icon: '📦' },
    { label: 'Customers', href: '/store/customers', icon: '👤' },
    { label: 'Invoices', href: '/store/invoices', icon: '🧾' },
    { label: 'Settings', href: '/store/settings', icon: '⚙️' },
]

export default async function StoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user || (session.user as any).role !== 'STORE_MANAGER') {
        redirect('/login')
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="PetBuddyCentral" />
                    <div>
                        <div className="sidebar-logo-text">PetBuddyCentral</div>
                        <div className="sidebar-logo-sub">Store Manager</div>
                    </div>
                </div>

                <SidebarNav items={NAV_ITEMS} sectionTitle="Operations" />

                <div className="sidebar-footer">
                    <div
                        className="sidebar-item"
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--glass-radius-sm)',
                            background: 'var(--glass-bg)',
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>👔</span>
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
                                {(session.user as any).storeName}
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
