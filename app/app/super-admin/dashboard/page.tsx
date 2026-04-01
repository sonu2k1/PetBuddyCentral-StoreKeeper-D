import { auth } from '@/lib/auth'
import { getSuperAdminDashboard } from '@/app/actions/dashboard'
import { formatCurrency, formatCompact } from '@/lib/utils'

export default async function SuperAdminDashboard() {
    const session = await auth()
    const data = await getSuperAdminDashboard()

    const kpis = [
        {
            label: 'Total Revenue',
            value: data.totalRevenue > 0 ? formatCompact(data.totalRevenue) : formatCurrency(0),
            trend: data.todayRevenue > 0 ? `+${formatCurrency(data.todayRevenue)} today` : 'No sales yet',
            trendUp: data.todayRevenue > 0,
            color: 'teal',
            icon: '💰',
        },
        {
            label: 'Active Stores',
            value: String(data.activeStores),
            trend: 'All Operational',
            trendUp: true,
            color: 'blue',
            icon: '🏪',
        },
        {
            label: 'Total Products',
            value: String(data.totalProducts),
            trend: `${data.lowStockCount} low stock alerts`,
            trendUp: data.lowStockCount === 0,
            color: 'coral',
            icon: '📦',
        },
        {
            label: "Today's Orders",
            value: String(data.todayOrderCount),
            trend: data.todayOrderCount > 0 ? `${formatCurrency(data.todayRevenue)} revenue` : 'No orders yet',
            trendUp: data.todayOrderCount > 0,
            color: 'warning',
            icon: '🧾',
        },
    ]

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Franchise Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-teal">Super Admin</span>
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--pbc-teal-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                        }}
                    >
                        🏢
                    </div>
                </div>
            </header>

            <div className="page-body">
                {/* Welcome Banner */}
                <div
                    className="glass-card animate-in"
                    style={{
                        marginBottom: 'var(--space-8)',
                        background:
                            'linear-gradient(135deg, rgba(42, 170, 138, 0.12) 0%, rgba(74, 141, 183, 0.08) 100%)',
                        borderColor: 'rgba(42, 170, 138, 0.2)',
                    }}
                >
                    <h2
                        style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--space-2)',
                        }}
                    >
                        Welcome back, {session?.user?.name} 👋
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Your franchise overview — {data.activeStores} active stores, {data.totalProducts} products, {data.totalCustomers} customers.
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

                {/* Content Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr',
                        gap: 'var(--space-5)',
                        marginTop: 'var(--space-5)',
                    }}
                >
                    {/* Revenue Chart Placeholder */}
                    <div className="glass-card animate-in animate-in-delay-3">
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--space-5)',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: 'var(--text-lg)',
                                    fontWeight: 700,
                                }}
                            >
                                Revenue Trend
                            </h3>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button className="btn btn-sm btn-ghost">7D</button>
                                <button className="btn btn-sm btn-secondary">30D</button>
                                <button className="btn btn-sm btn-ghost">90D</button>
                            </div>
                        </div>
                        <div
                            style={{
                                height: '280px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                fontSize: 'var(--text-sm)',
                                border: '1px dashed var(--glass-border)',
                                borderRadius: 'var(--glass-radius-sm)',
                            }}
                        >
                            📈 Revenue chart will render here with Recharts
                        </div>
                    </div>

                    {/* Store Performance */}
                    <div className="glass-card animate-in animate-in-delay-4">
                        <h3
                            style={{
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                marginBottom: 'var(--space-5)',
                            }}
                        >
                            Store Performance
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {data.storePerformance.map((store: any) => (
                                <div
                                    key={store.code}
                                    style={{
                                        padding: 'var(--space-4)',
                                        background: 'var(--glass-bg)',
                                        borderRadius: 'var(--glass-radius-sm)',
                                        border: '1px solid var(--glass-border)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 'var(--space-2)',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                                {store.name}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {store.code} · {store.invoiceCount} invoices
                                            </div>
                                        </div>
                                        <span className="badge badge-success">Active</span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'baseline',
                                        }}
                                    >
                                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>
                                            {formatCurrency(store.totalRevenue)}
                                        </span>
                                        {store.todayOrders > 0 && (
                                            <span className="kpi-card-trend kpi-card-trend--up">
                                                {store.todayOrders} orders today
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {data.storePerformance.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                                    No stores found
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
