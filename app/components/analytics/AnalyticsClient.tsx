'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react'

interface AnalyticsClientProps {
    sales: any
    products: any
    customers: any
    inventory: any
}

export function AnalyticsClient({ sales, products, customers, inventory }: AnalyticsClientProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-4)' }}>
                {[
                    { label: 'Revenue (30d)', value: formatCurrency(sales.totals.revenue), icon: TrendingUp, color: 'var(--pbc-teal)' },
                    { label: 'Orders', value: sales.totals.orders, icon: ShoppingCart, color: 'var(--pbc-blue)' },
                    { label: 'Avg. Order', value: formatCurrency(Math.round(sales.totals.avgOrder)), icon: ShoppingCart, color: '#6C5CE7' },
                    { label: 'Customers', value: customers.total, icon: Users, color: 'var(--warning)' },
                    { label: 'Low Stock', value: inventory.summary.lowStock, icon: AlertTriangle, color: 'var(--coral)' },
                ].map((kpi) => (
                    <GlassCard key={kpi.label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <kpi.icon size={20} style={{ color: kpi.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{kpi.label}</div>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{kpi.value}</div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Revenue by day + Store comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                {/* Daily Revenue */}
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                        📈 Daily Revenue (Last 30 Days)
                    </h3>
                    {sales.daily.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No sales data yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '300px', overflowY: 'auto' }}>
                            {sales.daily.map((day: any) => {
                                const maxRev = Math.max(...sales.daily.map((d: any) => d.revenue))
                                const pct = maxRev > 0 ? (day.revenue / maxRev) * 100 : 0
                                return (
                                    <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '6px 0' }}>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>
                                            {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <div style={{ flex: 1, height: '24px', background: 'var(--glass-bg)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--pbc-teal), var(--pbc-blue))', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                                        </div>
                                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, width: '80px', textAlign: 'right' }}>
                                            {formatCurrency(day.revenue)}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '40px' }}>
                                            {day.orders} ord
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </GlassCard>

                {/* Store Comparison */}
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏪 Store Revenue</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {sales.storeBreakdown.map((store: any) => (
                            <div key={store.code} style={{ padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{store.name}</span>
                                    <code style={{ fontSize: '10px', color: 'var(--pbc-teal)' }}>{store.code}</code>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(store.revenue)}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{store.orders} orders</span>
                                </div>
                            </div>
                        ))}
                        {sales.storeBreakdown.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>No store data</div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Payment Breakdown + Customer Tiers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💳 Payment Methods</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {Object.entries(sales.paymentBreakdown).map(([method, amount]: [string, any]) => {
                            const icons: Record<string, string> = { CASH: '💵', UPI: '📱', CARD: '💳' }
                            const total = sales.totals.revenue || 1
                            const pct = Math.round((amount / total) * 100)
                            return (
                                <div key={method} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <span style={{ fontSize: '18px', width: '28px' }}>{icons[method] || '💰'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{method}</span>
                                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{formatCurrency(amount)} ({pct}%)</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--pbc-teal)', borderRadius: '3px' }} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏆 Customer Tiers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {Object.entries(customers.tierDistribution).map(([tier, count]: [string, any]) => {
                            const tierEmoji: Record<string, string> = { GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉' }
                            return (
                                <div key={tier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>{tierEmoji[tier] || ''} {tier}</span>
                                    <span className="badge badge-neutral">{count} customers</span>
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Top Products */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💰 Top Products by Revenue</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>#</th><th>Product</th><th>Category</th><th className="text-right">Revenue</th></tr></thead>
                            <tbody>
                                {products.topByRevenue.slice(0, 10).map((p: any, i: number) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 700, color: i < 3 ? 'var(--pbc-teal)' : 'var(--text-muted)' }}>{i + 1}</td>
                                        <td><div style={{ fontWeight: 500 }}>{p.name}</div><code style={{ fontSize: '10px' }}>{p.sku}</code></td>
                                        <td style={{ fontSize: 'var(--text-sm)' }}>{p.icon} {p.category}</td>
                                        <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📦 Top Products by Quantity</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>#</th><th>Product</th><th>Category</th><th className="text-right">Qty Sold</th></tr></thead>
                            <tbody>
                                {products.topByQuantity.slice(0, 10).map((p: any, i: number) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 700, color: i < 3 ? 'var(--pbc-teal)' : 'var(--text-muted)' }}>{i + 1}</td>
                                        <td><div style={{ fontWeight: 500 }}>{p.name}</div><code style={{ fontSize: '10px' }}>{p.sku}</code></td>
                                        <td style={{ fontSize: 'var(--text-sm)' }}>{p.icon} {p.category}</td>
                                        <td className="text-right" style={{ fontWeight: 700 }}>{p.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* Category + Top Customers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏷️ Category Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {products.categories.map((cat: any) => (
                            <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 500 }}>{cat.icon} {cat.name}</span>
                                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(cat.revenue)}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{cat.quantity} units</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>👑 Top Customers</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>Customer</th><th>Tier</th><th>Orders</th><th className="text-right">Spent</th></tr></thead>
                            <tbody>
                                {customers.topCustomers.slice(0, 8).map((c: any) => {
                                    const emoji: Record<string, string> = { GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉' }
                                    return (
                                        <tr key={c.id}>
                                            <td><div style={{ fontWeight: 500 }}>{c.name}</div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.phone}</span></td>
                                            <td>{emoji[c.tier] || ''} {c.tier}</td>
                                            <td>{c.orderCount}</td>
                                            <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(c.totalSpent)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* Inventory Summary */}
            <GlassCard>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>📊 Inventory Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total SKUs</div>
                        <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{inventory.summary.totalSKUs}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Retail Value</div>
                        <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--pbc-teal)' }}>{formatCurrency(inventory.summary.totalRetailValue)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Low Stock Items</div>
                        <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--warning)' }}>{inventory.summary.lowStock}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Out of Stock</div>
                        <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--coral)' }}>{inventory.summary.outOfStock}</div>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
