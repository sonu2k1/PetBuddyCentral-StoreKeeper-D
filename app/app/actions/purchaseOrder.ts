'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ GET all purchase orders
export async function getPurchaseOrders(params?: {
    status?: string
    supplierId?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    // Get all stores in org
    const stores = await prisma.store.findMany({
        where: { orgId },
        select: { id: true },
    })
    const storeIds = stores.map((s) => s.id)

    const where: any = { storeId: { in: storeIds } }
    if (params?.status) where.status = params.status
    if (params?.supplierId) where.supplierId = params.supplierId

    return prisma.purchaseOrder.findMany({
        where,
        include: {
            supplier: true,
            items: { include: { purchaseOrder: false } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

// ✅ CREATE purchase order
export async function createPurchaseOrder(data: {
    storeId: string
    supplierId: string
    expectedDate?: string
    notes?: string
    items: Array<{
        productId: string
        quantityOrdered: number
        unitCost: number
    }>
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    if (!data.items || data.items.length === 0) {
        throw new Error('Purchase order must have at least one item')
    }

    // Generate PO number
    const count = await prisma.purchaseOrder.count({ where: { storeId: data.storeId } })
    const poNumber = `PO-${String(count + 1).padStart(4, '0')}`

    const totalAmount = data.items.reduce((sum, item) => sum + item.unitCost * item.quantityOrdered, 0)

    const po = await prisma.purchaseOrder.create({
        data: {
            storeId: data.storeId,
            supplierId: data.supplierId,
            poNumber,
            expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
            notes: data.notes || null,
            totalAmount,
            items: {
                create: data.items.map((item) => ({
                    productId: item.productId,
                    quantityOrdered: item.quantityOrdered,
                    unitCost: item.unitCost,
                })),
            },
        },
        include: { supplier: true, items: true },
    })

    revalidatePath('/franchise/purchase-orders')
    return po
}

// ✅ UPDATE PO status
export async function updatePOStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const po = await prisma.purchaseOrder.update({
        where: { id },
        data: { status },
    })

    revalidatePath('/franchise/purchase-orders')
    return po
}

// ✅ RECEIVE PO items (updates inventory)
export async function receivePOItems(id: string, receivedItems: Array<{ itemId: string; quantityReceived: number }>) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const userId = session.user.id!

    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
    })
    if (!po) throw new Error('Purchase order not found')

    await prisma.$transaction(async (tx) => {
        for (const received of receivedItems) {
            const poItem = po.items.find((i) => i.id === received.itemId)
            if (!poItem) continue

            // Update PO item
            await tx.purchaseOrderItem.update({
                where: { id: poItem.id },
                data: { quantityReceived: { increment: received.quantityReceived } },
            })

            // Update store inventory
            const inventory = await tx.storeInventory.findUnique({
                where: { storeId_productId: { storeId: po.storeId, productId: poItem.productId } },
            })

            if (inventory) {
                await tx.storeInventory.update({
                    where: { id: inventory.id },
                    data: {
                        quantity: { increment: received.quantityReceived },
                        lastRestocked: new Date(),
                    },
                })
                // Log stock adjustment
                await tx.stockAdjustment.create({
                    data: {
                        inventoryId: inventory.id,
                        userId,
                        type: 'RECEIVE',
                        quantity: received.quantityReceived,
                        reason: `PO ${po.poNumber}`,
                    },
                })
            } else {
                // Create inventory record if it doesn't exist
                const newInv = await tx.storeInventory.create({
                    data: {
                        storeId: po.storeId,
                        productId: poItem.productId,
                        quantity: received.quantityReceived,
                        lastRestocked: new Date(),
                    },
                })
                await tx.stockAdjustment.create({
                    data: {
                        inventoryId: newInv.id,
                        userId,
                        type: 'RECEIVE',
                        quantity: received.quantityReceived,
                        reason: `PO ${po.poNumber}`,
                    },
                })
            }
        }

        // Check if all items fully received → mark as RECEIVED
        const updatedItems = await tx.purchaseOrderItem.findMany({
            where: { purchaseOrderId: id },
        })
        const allReceived = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered)
        const someReceived = updatedItems.some((i) => i.quantityReceived > 0)

        await tx.purchaseOrder.update({
            where: { id },
            data: { status: allReceived ? 'RECEIVED' : someReceived ? 'PARTIAL' : 'SENT' },
        })
    })

    revalidatePath('/franchise/purchase-orders')
    revalidatePath('/franchise/inventory')
    revalidatePath('/store/inventory')
    return { success: true }
}
