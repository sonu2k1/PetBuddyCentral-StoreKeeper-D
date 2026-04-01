import { auth } from '@/lib/auth'
import { getPurchaseOrders } from '@/app/actions/purchaseOrder'
import { getSuppliers } from '@/app/actions/supplier'
import { getStores } from '@/app/actions/store'
import { PurchaseOrdersClient } from '@/components/purchase-orders/PurchaseOrdersClient'

export const metadata = { title: 'Purchase Orders | PetBuddyCentral' }

export default async function PurchaseOrdersPage() {
    const session = await auth()
    const orgId = (session?.user as any)?.orgId

    const [purchaseOrders, suppliers, stores] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
        getStores(),
    ])

    // Get products for PO creation
    const { prisma } = await import('@/lib/prisma')
    const products = await prisma.product.findMany({
        where: { orgId, isActive: true },
        select: { id: true, name: true, sku: true, costPrice: true, price: true },
        orderBy: { name: 'asc' },
    })

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Purchase Orders</h1>
                <span className="badge badge-blue">Franchise Owner</span>
            </header>
            <div className="page-body">
                <PurchaseOrdersClient
                    purchaseOrders={purchaseOrders}
                    suppliers={suppliers}
                    stores={stores}
                    products={products}
                />
            </div>
        </>
    )
}
