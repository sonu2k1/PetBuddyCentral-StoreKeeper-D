import { auth } from '@/lib/auth'
import { getStoreInventory } from '@/app/actions/inventory'
import { InventoryClient } from '@/components/inventory/InventoryClient'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'HQ Inventory | PetBuddyCentral',
}

export default async function FranchiseInventoryPage({
    searchParams,
}: {
    searchParams: { store?: string }
}) {
    const session = await auth()
    const orgId = (session?.user as any)?.orgId

    if (!orgId) return null

    // Franchise owners can view any store in their org.
    // We fetch all stores to build a selector
    const stores = await prisma.store.findMany({
        where: { orgId, isActive: true },
        select: { id: true, name: true }
    })

    // Determine which store to view. Default to the first one if not specified.
    const activeStoreId = searchParams.store || (stores.length > 0 ? stores[0].id : null)

    if (!activeStoreId) {
        return <div className="page-body">No active stores found for this franchise.</div>
    }

    const initialData = await getStoreInventory(activeStoreId)
    const activeStoreName = stores.find((s: { id: string, name: string }) => s.id === activeStoreId)?.name

    return (
        <>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">HQ Inventory Control</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span className="badge badge-teal">Franchise Wide</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {stores.map((store: { id: string, name: string }) => (
                        <a
                            key={store.id}
                            href={`/franchise/inventory?store=${store.id}`}
                            className={`badge ${store.id === activeStoreId ? 'badge-primary' : 'badge-neutral'}`}
                            style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none' }}
                        >
                            {store.name}
                        </a>
                    ))}
                </div>
            </header>

            <div className="page-body">
                <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        Viewing: {activeStoreName} — Stock Levels
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Monitor real-time stock levels across all your franchise locations. Select a store from the top right to switch views.
                    </p>
                </div>

                <Suspense fallback={<div className="glass-card">Loading franchise inventory...</div>}>
                    {/* Key forces remount when switching stores */}
                    <InventoryClient key={activeStoreId} storeId={activeStoreId} initialData={initialData} />
                </Suspense>
            </div>
        </>
    )
}
