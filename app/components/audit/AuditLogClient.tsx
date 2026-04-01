'use client'

import { useState, useMemo } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { formatDateTime } from '@/lib/utils'
import { Search, FileText, UserPlus, Package, Store, CreditCard, Shield, Activity } from 'lucide-react'

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    CREATE_INVOICE: { icon: CreditCard, color: 'var(--pbc-teal)', label: 'Invoice Created' },
    CREATE_USER: { icon: UserPlus, color: 'var(--pbc-blue)', label: 'User Created' },
    CREATE_STORE: { icon: Store, color: '#6C5CE7', label: 'Store Created' },
    ADJUST_STOCK: { icon: Package, color: 'var(--warning)', label: 'Stock Adjusted' },
    CREATE_PRODUCT: { icon: Package, color: 'var(--pbc-teal)', label: 'Product Created' },
    UPDATE_SETTINGS: { icon: Shield, color: 'var(--coral)', label: 'Settings Updated' },
}

interface AuditLogClientProps {
    logs: any[]
}

export function AuditLogClient({ logs }: AuditLogClientProps) {
    const [search, setSearch] = useState('')
    const [entityFilter, setEntityFilter] = useState('')

    const entities = useMemo(() => {
        return [...new Set(logs.map((l: any) => l.entity))]
    }, [logs])

    const filteredLogs = useMemo(() => {
        return logs.filter((log: any) => {
            const matchSearch = !search ||
                log.action.toLowerCase().includes(search.toLowerCase()) ||
                log.user?.name.toLowerCase().includes(search.toLowerCase()) ||
                log.entity.toLowerCase().includes(search.toLowerCase())
            const matchEntity = !entityFilter || log.entity === entityFilter
            return matchSearch && matchEntity
        })
    }, [logs, search, entityFilter])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Events</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{logs.length}</div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Unique Users</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                            {new Set(logs.map((l: any) => l.userId)).size}
                        </div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Entity Types</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{entities.length}</div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Today</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                            {logs.filter((l: any) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Search / Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ flex: 1, maxWidth: '300px' }}>
                    <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={18} />} style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className={`pos-category-tab ${!entityFilter ? 'pos-category-tab--active' : ''}`} onClick={() => setEntityFilter('')}>All</button>
                    {entities.map((entity: string) => (
                        <button
                            key={entity}
                            className={`pos-category-tab ${entityFilter === entity ? 'pos-category-tab--active' : ''}`}
                            onClick={() => setEntityFilter(entityFilter === entity ? '' : entity)}
                        >
                            {entity}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Timeline */}
            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Action</th>
                                <th>User</th>
                                <th>Entity</th>
                                <th>Details</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log: any) => {
                                const config = ACTION_CONFIG[log.action] || { icon: Activity, color: 'var(--text-muted)', label: log.action }
                                const IconComponent = config.icon
                                let details: any = {}
                                try { details = log.details ? JSON.parse(log.details) : {} } catch { }
                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: `${config.color}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <IconComponent size={16} style={{ color: config.color }} />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{config.label}</div>
                                            <code style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.action}</code>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{log.user?.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.user?.role}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">{log.entity}</span>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                <code>{log.entityId.substring(0, 12)}...</code>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                                            {Object.entries(details).map(([key, val]) => (
                                                <div key={key}><strong>{key}:</strong> {String(val)}</div>
                                            ))}
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {formatDateTime(log.createdAt)}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                        <FileText size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                                        <div>No audit events yet</div>
                                        <div style={{ fontSize: 'var(--text-xs)' }}>Events are logged for invoices, users, stores, and more</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    )
}
