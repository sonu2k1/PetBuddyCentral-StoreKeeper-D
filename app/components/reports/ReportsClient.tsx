'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { formatCurrency } from '@/lib/utils'

interface ReportsClientProps {
    sales: any
    products: any
    customers: any
}

export function ReportsClient({ sales, products, customers }: ReportsClientProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                {[
                    { label: 'Total Revenue', value: formatCurrency(sales.totals.revenue), color: 'var(--pbc-teal)' },
                    { label: 'Total Orders', value: sales.totals.orders, color: 'var(--pbc-blue)' },
                    { label: 'Avg. Order Value', value: formatCurrency(Math.round(sales.totals.avgOrder)), color: '#6C5CE7' },
                    { label: 'Total Customers', value: customers.total, color: 'var(--warning)' },
                ].map((kpi) => (
                    <GlassCard key={kpi.label}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{kpi.label}</div>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Sales by Store */}
            <GlassCard>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏪 Revenue by Store</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Store</th><th>Code</th><th className="text-right">Revenue</th><th className="text-right">Orders</th><th className="text-right">Avg. Order</th></tr>
                        </thead>
                        <tbody>
                            {sales.storeBreakdown.map((store: any) => (
                                <tr key={store.code}>
                                    <td style={{ fontWeight: 600 }}>{store.name}</td>
                                    <td><code style={{ color: 'var(--pbc-teal)' }}>{store.code}</code></td>
                                    <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(store.revenue)}</td>
                                    <td className="text-right">{store.orders}</td>
                                    <td className="text-right">{formatCurrency(store.orders > 0 ? Math.round(store.revenue / store.orders) : 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Top Products + Category breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🔥 Top Products</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>#</th><th>Product</th><th className="text-right">Revenue</th><th className="text-right">Sold</th></tr></thead>
                            <tbody>
                                {products.topByRevenue.slice(0, 10).map((p: any, i: number) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 700, color: i < 3 ? 'var(--pbc-teal)' : 'var(--text-muted)' }}>{i + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.icon} {p.category}</span>
                                        </td>
                                        <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(p.revenue)}</td>
                                        <td className="text-right">{p.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏷️ Categories</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {products.categories.map((cat: any) => {
                            const maxRev = Math.max(...products.categories.map((c: any) => c.revenue), 1)
                            const pct = (cat.revenue / maxRev) * 100
                            return (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{cat.icon} {cat.name}</span>
                                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{formatCurrency(cat.revenue)}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--glass-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--pbc-teal), var(--pbc-blue))', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Top Customers + Payment Methods */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>👑 Top Customers</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>Customer</th><th>Tier</th><th className="text-right">Spent</th></tr></thead>
                            <tbody>
                                {customers.topCustomers.slice(0, 10).map((c: any) => {
                                    const emoji: Record<string, string> = { GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉' }
                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{c.name}</div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.phone} · {c.petCount} pets</span>
                                            </td>
                                            <td><span className="badge badge-neutral">{emoji[c.tier] || ''} {c.tier}</span></td>
                                            <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(c.totalSpent)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💳 Payment Split</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {Object.entries(sales.paymentBreakdown).map(([method, amount]: [string, any]) => {
                            const icons: Record<string, string> = { CASH: '💵', UPI: '📱', CARD: '💳' }
                            const pct = sales.totals.revenue > 0 ? Math.round((amount / sales.totals.revenue) * 100) : 0
                            return (
                                <div key={method} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <span style={{ fontSize: '24px' }}>{icons[method] || '💰'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600 }}>{method}</span>
                                            <span style={{ fontWeight: 700 }}>{formatCurrency(amount)}</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', marginTop: '4px' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--pbc-teal)', borderRadius: '3px' }} />
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{pct}% of total</div>
                                    </div>
                                </div>
                            )
                        })}
                        {Object.keys(sales.paymentBreakdown).length === 0 && (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>No payment data yet</div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
