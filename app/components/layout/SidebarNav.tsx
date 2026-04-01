'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

interface NavItem {
    label: string
    href: string
    icon: string
    badge?: string
}

interface SidebarNavProps {
    items: NavItem[]
    sectionTitle: string
}

export function SidebarNav({ items, sectionTitle }: SidebarNavProps) {
    const pathname = usePathname()

    return (
        <nav className="sidebar-section">
            <div className="sidebar-section-title">{sectionTitle}</div>
            {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    </Link>
                )
            })}
        </nav>
    )
}

export function LogoutButton() {
    const handleLogout = async () => {
        // Use NextAuth signOut via form action to /api/auth/signout
        window.location.href = '/api/auth/signout'
    }

    return (
        <button
            onClick={handleLogout}
            className="sidebar-item sidebar-logout-btn"
            style={{
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                background: 'none',
                padding: '10px 12px',
                borderRadius: 'var(--glass-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                marginTop: '8px',
            }}
        >
            <LogOut size={16} />
            <span>Sign Out</span>
        </button>
    )
}
