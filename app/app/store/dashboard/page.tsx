import { auth } from '@/lib/auth'
import { getStoreDashboard } from '@/app/actions/dashboard'
import { getActiveShift } from '@/app/actions/shift'
import { getTodayCashDrawer } from '@/app/actions/cashDrawer'
import { formatCurrency, formatCompact, formatDateTime } from '@/lib/utils'
import { ShiftClock } from '@/components/operations/ShiftClock'
import { CashDrawerWidget } from '@/components/operations/CashDrawerWidget'
import Link from 'next/link'

export default async function StoreDashboard() {
    const session = await auth()
    const [data, activeShift, cashDrawer] = await Promise.all([
        getStoreDashboard(),
        getActiveShift(),
        getTodayCashDrawer(),
    ])

    const kpis = [
        {
            label: "Today's Revenue",
            value: data.todayRevenue > 0 ? formatCurrency(data.todayRevenue) : '₹0',
            trend: data.todayOrderCount > 0 ? `${data.todayOrderCount} orders today` : 'No orders yet',
            trendUp: data.todayRevenue > 0,
            color: 'teal',
            icon: '💰',
        },
        {
            label: "Today's Orders",
            value: String(data.todayOrderCount),
            trend: `${data.weekOrderCount} this week`,
            trendUp: data.todayOrderCount > 0,
            color: 'blue',
            icon: '🧾',
        },
        {
            label: 'Week Revenue',
            value: data.weekRevenue > 0 ? formatCompact(data.weekRevenue) : '₹0',
            trend: `${data.weekOrderCount} orders (7 days)`,
            trendUp: data.weekRevenue > 0,
            color: 'coral',
            icon: '📈',
        },
        {
            label: 'Low Stock Items',
            value: String(data.lowStockItems.length),
            trend: data.lowStockItems.length > 0 ? 'Needs attention' : 'All stocked',
            trendUp: data.lowStockItems.length === 0,
            color: 'warning',
            icon: '⚠️',
        },
    ]

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Store Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-blue">Store Manager</span>
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
                        Welcome, {session?.user?.name} 👋
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {(session?.user as any)?.storeName || 'Your store'} — {data.totalCustomers} registered customers.
                    </p>
                </div>

                {/* Shift + Cash Drawer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                    <ShiftClock activeShift={activeShift} />
                    <CashDrawerWidget drawer={cashDrawer} />
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
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-5)',
                        marginTop: 'var(--space-5)',
                    }}
                >
                    {/* Top Products Today */}
                    <div className="glass-card animate-in animate-in-delay-3">
                        <h3
                            style={{
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            🏆 Top Products Today
                        </h3>
                        {data.topProducts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {data.topProducts.map((product: any, i: number) => (
                                    <div
                                        key={product.name}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--space-3)',
                                            background: 'var(--glass-bg)',
                                            borderRadius: 'var(--glass-radius-sm)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <span
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    background: 'var(--pbc-teal-subtle)',
                                                    color: 'var(--pbc-teal)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 'var(--text-xs)',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <div>
                                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                                                    {product.name}
                                                </div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                    {product.quantity} units
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                                            {formatCurrency(product.revenue)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                                No sales today — <Link href="/store/pos" style={{ color: 'var(--pbc-teal)' }}>Open POS</Link>
                            </p>
                        )}
                    </div>

                    {/* Recent Invoices */}
                    <div className="glass-card animate-in animate-in-delay-4">
                        <h3
                            style={{
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            🧾 Recent Sales
                        </h3>
                        {data.recentInvoices.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {data.recentInvoices.map((inv: any) => (
                                    <div
                                        key={inv.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--space-3)',
                                            background: 'var(--glass-bg)',
                                            borderRadius: 'var(--glass-radius-sm)',
                                        }}
                                    >
                                        <div>
                                            <code style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                                                {inv.invoiceNumber}
                                            </code>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {inv.customerName} · {formatDateTime(inv.time)}
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                                            {formatCurrency(inv.total)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                                No sales today yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                {data.lowStockItems.length > 0 && (
                    <div className="glass-card animate-in" style={{ marginTop: 'var(--space-5)' }}>
                        <h3
                            style={{
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            ⚠️ Low Stock Items
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
                                            SKU: {item.product.sku}
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

                {/* Quick Action */}
                <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
                    <Link href="/store/pos">
                        <button
                            className="btn btn-primary"
                            style={{ padding: '14px 32px', fontSize: 'var(--text-base)', fontWeight: 700 }}
                        >
                            🧾 Open Point of Sale
                        </button>
                    </Link>
                </div>
            </div>
        </>
    )
}
