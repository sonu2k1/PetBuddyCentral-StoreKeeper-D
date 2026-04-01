import { auth } from '@/lib/auth'
import { getStoreInventory } from '@/app/actions/inventory'
import { InventoryClient } from '@/components/inventory/InventoryClient'
import { Suspense } from 'react'

export const metadata = {
    title: 'Inventory | PetBuddyCentral',
}

export default async function StoreInventoryPage() {
    const session = await auth()
    const storeId = (session?.user as any)?.storeId

    if (!storeId) {
        return <div className="page-body">No store assigned to this account.</div>
    }

    const initialData = await getStoreInventory(storeId)

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Store Inventory</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-blue">Store Manager</span>
                </div>
            </header>

            <div className="page-body">
                <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        Manage Live Stock
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        View real-time stock levels, check low stock alerts, and log manual adjustments.
                    </p>
                </div>

                <Suspense fallback={<div className="glass-card">Loading inventory data...</div>}>
                    <InventoryClient storeId={storeId} initialData={initialData} />
                </Suspense>
            </div>
        </>
    )
}
