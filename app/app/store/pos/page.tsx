import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { POSClient } from '@/components/pos/POSClient'

export const metadata = {
    title: 'Point of Sale | PetBuddyCentral',
}

export default async function POSPage() {
    const session = await auth()
    const storeId = (session?.user as any)?.storeId
    const orgId = (session?.user as any)?.orgId

    if (!storeId) {
        return <div className="page-body">No store assigned to this account.</div>
    }

    // Fetch products with inventory for this store
    const products = await prisma.product.findMany({
        where: { orgId, isActive: true },
        include: {
            category: true,
            inventory: {
                where: { storeId },
            },
        },
        orderBy: { name: 'asc' },
    })

    // Fetch categories
    const categories = await prisma.category.findMany({
        where: { orgId },
        orderBy: { sortOrder: 'asc' },
    })

    return (
        <>
            <header className="page-header" style={{ paddingBottom: 'var(--space-3)' }}>
                <h1 className="page-title">
                    🧾 Point of Sale
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-teal">
                        {(session?.user as any)?.storeName}
                    </span>
                </div>
            </header>

            <div className="page-body" style={{ padding: '0 var(--space-5) var(--space-5)' }}>
                <POSClient
                    storeId={storeId}
                    products={products}
                    categories={categories}
                />
            </div>
        </>
    )
}
