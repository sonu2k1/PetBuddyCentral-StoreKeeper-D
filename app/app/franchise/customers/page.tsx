import { auth } from '@/lib/auth'
import { getCustomers } from '@/app/actions/customer'
import { CustomerListClient } from '@/components/customers/CustomerListClient'

export const metadata = {
    title: 'Customers | PetBuddyCentral',
}

export default async function FranchiseCustomersPage() {
    const session = await auth()
    const initialData = await getCustomers()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Customers</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-teal">Franchise Owner</span>
                </div>
            </header>

            <div className="page-body">
                <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        Customer Management
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Manage customers, view their pets, loyalty tiers, and purchase history across all stores.
                    </p>
                </div>

                <CustomerListClient initialData={initialData} />
            </div>
        </>
    )
}
