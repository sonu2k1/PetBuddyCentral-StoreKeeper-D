'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from './audit'
import { generateInvoiceNumber, calculateGST } from '@/lib/utils'

// ✅ CREATE Invoice (from POS)
export async function createInvoice(data: {
    storeId: string
    customerId?: string
    items: Array<{
        productId: string
        quantity: number
        unitPrice: number
    }>
    discount: number
    paymentMethod: string
    notes?: string
    status?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const userId = session.user.id!
    const orgId = (session.user as any).orgId
    const userRole = (session.user as any).role
    const userStoreId = (session.user as any).storeId

    const { storeId, customerId, items, discount, paymentMethod, notes, status = 'COMPLETED' } = data

    // Security: Store Managers can only bill from their store
    if (userRole === 'STORE_MANAGER' && userStoreId !== storeId) {
        throw new Error('Unauthorized')
    }

    if (!items || items.length === 0) {
        throw new Error('Invoice must have at least one item')
    }

    // Get store info for invoice number
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store || store.orgId !== orgId) throw new Error('Store not found')

    // Get next sequence number
    const lastInvoice = await prisma.invoice.findFirst({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
    })

    let sequence = 1
    if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-')
        const lastSeq = parseInt(parts[parts.length - 1], 10)
        if (!isNaN(lastSeq)) sequence = lastSeq + 1
    }

    const invoiceNumber = generateInvoiceNumber(store.code, sequence)

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const gst = calculateGST(subtotal - discount)

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create the invoice
        const invoice = await tx.invoice.create({
            data: {
                storeId,
                customerId: customerId || null,
                createdById: userId,
                invoiceNumber,
                subtotal,
                taxRate: gst.taxRate,
                taxAmount: gst.taxAmount,
                discount,
                total: gst.total,
                paymentMethod,
                status,
                notes: notes || null,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.unitPrice * item.quantity,
                    })),
                },
            },
            include: {
                items: { include: { product: true } },
                store: true,
                customer: true,
            },
        })

        // 2. Deduct inventory for each item (NOT for HELD invoices)
        if (status !== 'HELD') {
            for (const item of items) {
                const inventory = await tx.storeInventory.findUnique({
                    where: {
                        storeId_productId: { storeId, productId: item.productId },
                    },
                })

                if (inventory) {
                    const newQty = Math.max(0, inventory.quantity - item.quantity)
                    await tx.storeInventory.update({
                        where: { id: inventory.id },
                        data: { quantity: newQty },
                    })

                    // Log stock adjustment
                    await tx.stockAdjustment.create({
                        data: {
                            inventoryId: inventory.id,
                            userId,
                            type: 'SALE',
                            quantity: -item.quantity,
                            reason: `Invoice ${invoiceNumber}`,
                        },
                    })
                }
            }

            // 3. Add loyalty points to customer
            if (customerId) {
                const pointsEarned = Math.floor(subtotal * 0.01) // 1 point per ₹100
                const customer = await tx.customer.findUnique({ where: { id: customerId } })

                if (customer) {
                    const newTotal = customer.loyaltyPoints + pointsEarned
                    let newTier = 'BRONZE'
                    if (newTotal >= 1000) newTier = 'PLATINUM'
                    else if (newTotal >= 500) newTier = 'GOLD'
                    else if (newTotal >= 100) newTier = 'SILVER'

                    await tx.customer.update({
                        where: { id: customerId },
                        data: {
                            loyaltyPoints: newTotal,
                            loyaltyTier: newTier,
                        },
                    })
                }
            }
        }

        return invoice
    })

    revalidatePath('/store/pos')
    revalidatePath('/store/invoices')
    revalidatePath('/store/inventory')
    revalidatePath('/franchise/billing')
    revalidatePath('/franchise/inventory')

    // Audit log
    await logAuditEvent({
        action: 'CREATE_INVOICE',
        entity: 'Invoice',
        entityId: result.id,
        details: JSON.stringify({ invoiceNumber: result.invoiceNumber, total: result.total }),
    })

    return result
}

// ✅ REFUND Invoice — restores inventory and deducts loyalty points
export async function refundInvoice(invoiceId: string, reason?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const userId = session.user.id!

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, store: true },
    })

    if (!invoice) throw new Error('Invoice not found')
    if (invoice.status !== 'COMPLETED') throw new Error('Only completed invoices can be refunded')

    await prisma.$transaction(async (tx) => {
        // 1. Mark invoice as refunded
        await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: 'REFUNDED', notes: reason ? `REFUND: ${reason}` : 'Refunded' },
        })

        // 2. Restore inventory
        for (const item of invoice.items) {
            const inventory = await tx.storeInventory.findUnique({
                where: { storeId_productId: { storeId: invoice.storeId, productId: item.productId } },
            })
            if (inventory) {
                await tx.storeInventory.update({
                    where: { id: inventory.id },
                    data: { quantity: { increment: item.quantity } },
                })
                await tx.stockAdjustment.create({
                    data: {
                        inventoryId: inventory.id,
                        userId,
                        type: 'RETURN',
                        quantity: item.quantity,
                        reason: `Refund: ${invoice.invoiceNumber}`,
                    },
                })
            }
        }

        // 3. Deduct loyalty points if customer
        if (invoice.customerId) {
            const pointsToDeduct = Math.floor(invoice.subtotal * 0.01)
            await tx.customer.update({
                where: { id: invoice.customerId },
                data: { loyaltyPoints: { decrement: pointsToDeduct } },
            })
        }
    })

    revalidatePath('/store/invoices')
    revalidatePath('/franchise/billing')
    revalidatePath('/store/inventory')

    await logAuditEvent({
        action: 'REFUND_INVOICE',
        entity: 'Invoice',
        entityId: invoiceId,
        details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, total: invoice.total, reason }),
    })

    return { success: true }
}

// ✅ VOID Invoice — cancels without restoring stock (data entry error)
export async function voidInvoice(invoiceId: string, reason?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new Error('Invoice not found')
    if (invoice.status !== 'COMPLETED' && invoice.status !== 'HELD') {
        throw new Error('Cannot void this invoice')
    }

    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'VOIDED', notes: reason ? `VOIDED: ${reason}` : 'Voided' },
    })

    revalidatePath('/store/invoices')
    revalidatePath('/franchise/billing')

    await logAuditEvent({
        action: 'VOID_INVOICE',
        entity: 'Invoice',
        entityId: invoiceId,
        details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, reason }),
    })

    return { success: true }
}

// ✅ GET HELD Invoices for POS Resume
export async function getHeldInvoices(storeId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    return prisma.invoice.findMany({
        where: { storeId, status: 'HELD' },
        include: { items: { include: { product: true } }, customer: true },
        orderBy: { createdAt: 'desc' },
    })
}

// ✅ DELETE HELD Invoice (when resuming or cancelling)
export async function deleteHeldInvoice(invoiceId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice || invoice.status !== 'HELD') {
        throw new Error('Can only delete HELD invoices')
    }

    await prisma.invoice.delete({ where: { id: invoiceId } })
    return { success: true }
}

// ✅ GET Invoices for a store
export async function getInvoices(params?: {
    storeId?: string
    page?: number
    limit?: number
    status?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId
    const userRole = (session.user as any).role
    const userStoreId = (session.user as any).storeId
    const { page = 1, limit = 50, status } = params || {}

    // Determine which store(s) to query
    let storeFilter: any = {}
    if (params?.storeId) {
        storeFilter = { storeId: params.storeId }
    } else if (userRole === 'STORE_MANAGER' && userStoreId) {
        storeFilter = { storeId: userStoreId }
    } else {
        // Franchise Owner / Super Admin: all stores in org
        const stores = await prisma.store.findMany({
            where: { orgId },
            select: { id: true },
        })
        storeFilter = { storeId: { in: stores.map((s) => s.id) } }
    }

    const where = {
        ...storeFilter,
        ...(status ? { status } : {}),
    }

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            include: {
                store: true,
                customer: true,
                createdBy: true,
                items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.invoice.count({ where }),
    ])

    return {
        invoices,
        total,
        pages: Math.ceil(total / limit),
    }
}

// ✅ GET Invoice by share token (public, no auth)
export async function getInvoiceByToken(token: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { shareToken: token },
        include: {
            store: { include: { org: true } },
            customer: true,
            createdBy: { select: { name: true } },
            items: { include: { product: true } },
        },
    })

    if (!invoice) throw new Error('Invoice not found')
    return invoice
}
