import { getSalesReport, getProductPerformance, getCustomerInsights } from '@/app/actions/report'
import { ReportsClient } from '@/components/reports/ReportsClient'

export const metadata = { title: 'Reports | PetBuddyCentral' }

export default async function ReportsPage() {
    const [sales, products, customers] = await Promise.all([
        getSalesReport({ days: 30 }),
        getProductPerformance({ days: 30 }),
        getCustomerInsights(),
    ])

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Reports</h1>
                <span className="badge badge-blue">Franchise Owner</span>
            </header>
            <div className="page-body">
                <ReportsClient sales={sales} products={products} customers={customers} />
            </div>
        </>
    )
}
