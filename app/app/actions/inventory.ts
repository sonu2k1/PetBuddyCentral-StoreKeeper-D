'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getStoreInventory(
    storeId: string,
    params?: { search?: string; categoryId?: string; lowStockOnly?: boolean }
) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId
    const userRole = (session.user as any).role
    const userStoreId = (session.user as any).storeId

    // Security: Store Managers can only view their own store
    if (userRole === 'STORE_MANAGER' && userStoreId !== storeId) {
        throw new Error('Unauthorized access to store inventory')
    }

    // Ensure store belongs to org
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store || store.orgId !== orgId) throw new Error('Store not found')

    const { search, categoryId, lowStockOnly } = params || {}

    // Fetch all products matching criteria
    const products = await prisma.product.findMany({
        where: {
            orgId,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search } },
                        { sku: { contains: search } },
                    ],
                }
                : {}),
            ...(categoryId ? { categoryId } : {}),
        },
        include: {
            category: true,
            inventory: {
                where: { storeId },
            },
        },
        orderBy: { name: 'asc' },
    })

    // Format response and filter by low stock if requested
    const inventoryList = products.map((product: any) => {
        const inv = product.inventory[0]
        const quantity = inv?.quantity || 0
        const threshold = inv?.lowStockThreshold || 10
        const isLowStock = quantity <= threshold

        return {
            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                unit: product.unit,
                category: product.category,
            },
            inventoryId: inv?.id,
            quantity,
            lowStockThreshold: threshold,
            isLowStock,
            reorderPoint: inv?.reorderPoint || 15,
            lastRestocked: inv?.lastRestocked,
        }
    })

    if (lowStockOnly) {
        return inventoryList.filter((item) => item.isLowStock)
    }

    return inventoryList
}

export async function adjustStock(data: {
    storeId: string
    productId: string
    newQuantity: number
    reason: 'Initial' | 'Restock' | 'Damage' | 'Correction' | 'Return' | 'Transfer'
    notes?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const { storeId, productId, newQuantity, reason, notes } = data
    const userId = session.user.id
    const userRole = (session.user as any).role
    const userStoreId = (session.user as any).storeId
    const orgId = (session.user as any).orgId

    // Security
    if (userRole === 'STORE_MANAGER' && userStoreId !== storeId) {
        throw new Error('Unauthorized')
    }

    // Verify product and store belong to org
    const [product, store] = await Promise.all([
        prisma.product.findUnique({ where: { id: productId } }),
        prisma.store.findUnique({ where: { id: storeId } }),
    ])

    if (!product || product.orgId !== orgId || !store || store.orgId !== orgId) {
        throw new Error('Invalid product or store')
    }

    // Use transaction to ensure audit log and inventory update happen together
    const result = await prisma.$transaction(async (tx) => {
        // 1. Get or create inventory record
        let inventory = await tx.storeInventory.findUnique({
            where: {
                storeId_productId: { storeId, productId },
            },
        })

        const previousQuantity = inventory?.quantity || 0
        const difference = newQuantity - previousQuantity

        if (difference === 0) return inventory

        if (!inventory) {
            inventory = await tx.storeInventory.create({
                data: {
                    storeId,
                    productId,
                    quantity: newQuantity,
                    lastRestocked: reason === 'Restock' ? new Date() : null,
                },
            })
        } else {
            inventory = await tx.storeInventory.update({
                where: { id: inventory.id },
                data: {
                    quantity: newQuantity,
                    lastRestocked: reason === 'Restock' ? new Date() : (inventory.lastRestocked),
                },
            })
        }

        // 2. Create Audit Log
        await tx.stockAdjustment.create({
            data: {
                inventoryId: inventory.id,
                userId: userId!,
                type: reason,
                quantity: difference,
                reason: notes || `Stock adjusted from ${previousQuantity} to ${newQuantity}`,
            },
        })

        return inventory
    })

    revalidatePath('/franchise/inventory')
    revalidatePath('/store/inventory')

    return result
}
