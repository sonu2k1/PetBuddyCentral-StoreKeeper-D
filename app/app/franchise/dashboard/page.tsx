import { auth } from '@/lib/auth'
import { getFranchiseDashboard } from '@/app/actions/dashboard'
import { formatCurrency, formatCompact } from '@/lib/utils'

export default async function FranchiseDashboard() {
    const session = await auth()
    const data = await getFranchiseDashboard()

    const avgOrderValue = data.totalInvoices > 0
        ? Math.round(data.totalRevenue / data.totalInvoices)
        : 0

    const kpis = [
        {
            label: 'Total Revenue',
            value: data.totalRevenue > 0 ? formatCompact(data.totalRevenue) : formatCurrency(0),
            trend: data.todayRevenue > 0 ? `+${formatCurrency(data.todayRevenue)} today` : 'No sales today',
            trendUp: data.todayRevenue > 0,
            color: 'teal',
            icon: '💰',
        },
        {
            label: "Today's Orders",
            value: String(data.todayOrders),
            trend: `${data.totalInvoices} total invoices`,
            trendUp: data.todayOrders > 0,
            color: 'blue',
            icon: '🧾',
        },
        {
            label: 'Products in Catalog',
            value: String(data.totalProducts),
            trend: `${data.lowStockItems.length} low stock alerts`,
            trendUp: data.lowStockItems.length === 0,
            color: 'coral',
            icon: '📦',
        },
        {
            label: 'Avg Order Value',
            value: formatCurrency(avgOrderValue),
            trend: data.totalInvoices > 0 ? `Over ${data.totalInvoices} invoices` : 'No data yet',
            trendUp: avgOrderValue > 0,
            color: 'warning',
            icon: '📊',
        },
    ]

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Store Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-blue">Franchise Owner</span>
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--pbc-blue-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                        }}
                    >
                        🏪
                    </div>
                </div>
            </header>

            <div className="page-body">
                {/* Welcome */}
                <div
                    className="glass-card animate-in"
                    style={{
                        marginBottom: 'var(--space-8)',
                        background:
                            'linear-gradient(135deg, rgba(74, 141, 183, 0.12) 0%, rgba(42, 170, 138, 0.08) 100%)',
                        borderColor: 'rgba(74, 141, 183, 0.2)',
                    }}
                >
                    <h2
                        style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--space-2)',
                        }}
                    >
                        Welcome, {session?.user?.name} 🏪
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {(session?.user as any)?.storeName || 'Your stores'} — {data.stores.length} active store{data.stores.length !== 1 ? 's' : ''}, {data.totalProducts} products.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid">
                    {kpis.map((kpi, index) => (
                        <div
                            key={kpi.label}
                            className={`kpi-card kpi-card--${kpi.color} animate-in animate-in-delay-${index + 1}`}
                        >
                            <div className="kpi-card-header">
                                <span className="kpi-card-label">{kpi.label}</span>
                                <div className={`kpi-card-icon kpi-card-icon--${kpi.color}`}>{kpi.icon}</div>
                            </div>
                            <div className="kpi-card-value">{kpi.value}</div>
                            <span className={`kpi-card-trend kpi-card-trend--${kpi.trendUp ? 'up' : 'down'}`}>
                                {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Low Stock Alerts */}
                {data.lowStockItems.length > 0 && (
                    <div className="glass-card animate-in" style={{ marginTop: 'var(--space-5)' }}>
                        <h3
                            style={{
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            ⚠️ Low Stock Alerts
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {data.lowStockItems.map((item: any) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--space-3)',
                                        background: 'var(--glass-bg)',
                                        borderRadius: 'var(--glass-radius-sm)',
                                        border: '1px solid var(--glass-border)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                            {item.product.name}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                            {item.store.name} · SKU: {item.product.sku}
                                        </div>
                                    </div>
                                    <span className="badge badge-warning">
                                        {item.quantity} left
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
