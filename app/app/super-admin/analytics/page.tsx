import { getSalesReport, getProductPerformance, getCustomerInsights, getInventoryReport } from '@/app/actions/report'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'

export const metadata = { title: 'Analytics | PetBuddyCentral' }

export default async function AnalyticsPage() {
    const [sales, products, customers, inventory] = await Promise.all([
        getSalesReport({ days: 30 }),
        getProductPerformance({ days: 30 }),
        getCustomerInsights(),
        getInventoryReport(),
    ])

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Analytics & Reports</h1>
                <span className="badge badge-teal">Super Admin</span>
            </header>
            <div className="page-body">
                <AnalyticsClient sales={sales} products={products} customers={customers} inventory={inventory} />
            </div>
        </>
    )
}
