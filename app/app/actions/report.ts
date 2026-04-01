'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ✅ SALES REPORT — daily aggregated revenue
export async function getSalesReport(params?: {
    storeId?: string
    days?: number
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId
    const days = params?.days || 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get stores for this org
    const stores = await prisma.store.findMany({
        where: { orgId },
        select: { id: true, name: true, code: true },
    })
    const storeIds = params?.storeId ? [params.storeId] : stores.map((s) => s.id)

    const invoices = await prisma.invoice.findMany({
        where: {
            storeId: { in: storeIds },
            createdAt: { gte: startDate },
            status: 'COMPLETED',
        },
        select: {
            total: true,
            subtotal: true,
            taxAmount: true,
            discount: true,
            paymentMethod: true,
            createdAt: true,
            storeId: true,
        },
        orderBy: { createdAt: 'asc' },
    })

    // Daily breakdown
    const dailyMap = new Map<string, { date: string; revenue: number; orders: number; tax: number; discount: number }>()
    invoices.forEach((inv) => {
        const day = inv.createdAt.toISOString().split('T')[0]
        const existing = dailyMap.get(day) || { date: day, revenue: 0, orders: 0, tax: 0, discount: 0 }
        existing.revenue += inv.total
        existing.orders += 1
        existing.tax += inv.taxAmount
        existing.discount += inv.discount
        dailyMap.set(day, existing)
    })
    const daily = Array.from(dailyMap.values())

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {}
    invoices.forEach((inv) => {
        paymentBreakdown[inv.paymentMethod] = (paymentBreakdown[inv.paymentMethod] || 0) + inv.total
    })

    // Store-wise breakdown
    const storeBreakdown = stores.map((store) => {
        const storeInvoices = invoices.filter((i) => i.storeId === store.id)
        return {
            name: store.name,
            code: store.code,
            revenue: storeInvoices.reduce((sum, i) => sum + i.total, 0),
            orders: storeInvoices.length,
        }
    })

    return {
        daily,
        totals: {
            revenue: invoices.reduce((sum, i) => sum + i.total, 0),
            orders: invoices.length,
            avgOrder: invoices.length > 0 ? invoices.reduce((sum, i) => sum + i.total, 0) / invoices.length : 0,
            tax: invoices.reduce((sum, i) => sum + i.taxAmount, 0),
            discount: invoices.reduce((sum, i) => sum + i.discount, 0),
        },
        paymentBreakdown,
        storeBreakdown,
        stores,
    }
}

// ✅ PRODUCT PERFORMANCE
export async function getProductPerformance(params?: {
    storeId?: string
    days?: number
    limit?: number
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId
    const days = params?.days || 30
    const limit = params?.limit || 20

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stores = await prisma.store.findMany({ where: { orgId }, select: { id: true } })
    const storeIds = params?.storeId ? [params.storeId] : stores.map((s) => s.id)

    const invoiceItems = await prisma.invoiceItem.findMany({
        where: {
            invoice: {
                storeId: { in: storeIds },
                createdAt: { gte: startDate },
                status: 'COMPLETED',
            },
        },
        include: {
            product: { select: { id: true, name: true, sku: true, category: { select: { name: true, icon: true } } } },
        },
    })

    // Aggregate by product
    const productMap = new Map<string, { id: string; name: string; sku: string; category: string; icon: string; revenue: number; quantity: number }>()
    invoiceItems.forEach((item) => {
        const key = item.productId
        const existing = productMap.get(key) || {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            category: item.product.category?.name || '',
            icon: item.product.category?.icon || '',
            revenue: 0,
            quantity: 0,
        }
        existing.revenue += item.total
        existing.quantity += item.quantity
        productMap.set(key, existing)
    })

    const products = Array.from(productMap.values())
    const topByRevenue = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
    const topByQuantity = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, limit)

    // Category breakdown
    const categoryMap = new Map<string, { name: string; icon: string; revenue: number; quantity: number }>()
    products.forEach((p) => {
        const key = p.category
        const existing = categoryMap.get(key) || { name: p.category, icon: p.icon, revenue: 0, quantity: 0 }
        existing.revenue += p.revenue
        existing.quantity += p.quantity
        categoryMap.set(key, existing)
    })
    const categories = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)

    return { topByRevenue, topByQuantity, categories }
}

// ✅ CUSTOMER INSIGHTS
export async function getCustomerInsights() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const customers = await prisma.customer.findMany({
        where: { orgId },
        include: {
            _count: { select: { invoices: true, pets: true } },
            invoices: { select: { total: true }, where: { status: 'COMPLETED' } },
        },
    })

    const tierDistribution: Record<string, number> = {}
    const topCustomers = customers
        .map((c) => {
            tierDistribution[c.loyaltyTier] = (tierDistribution[c.loyaltyTier] || 0) + 1
            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                tier: c.loyaltyTier,
                points: c.loyaltyPoints,
                totalSpent: c.invoices.reduce((sum, i) => sum + i.total, 0),
                orderCount: c._count.invoices,
                petCount: c._count.pets,
            }
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 15)

    return {
        total: customers.length,
        tierDistribution,
        topCustomers,
    }
}

// ✅ INVENTORY REPORT
export async function getInventoryReport(params?: { storeId?: string }) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const stores = await prisma.store.findMany({ where: { orgId }, select: { id: true, name: true, code: true } })
    const storeIds = params?.storeId ? [params.storeId] : stores.map((s) => s.id)

    const inventory = await prisma.storeInventory.findMany({
        where: { storeId: { in: storeIds } },
        include: {
            product: { select: { name: true, sku: true, price: true, costPrice: true, category: { select: { name: true } } } },
            store: { select: { name: true, code: true } },
        },
        orderBy: { quantity: 'asc' },
    })

    const lowStock = inventory.filter((i) => i.quantity <= i.lowStockThreshold)
    const outOfStock = inventory.filter((i) => i.quantity <= 0)
    const totalValue = inventory.reduce((sum, i) => sum + i.quantity * (i.product.price || 0), 0)
    const totalCostValue = inventory.reduce((sum, i) => sum + i.quantity * (i.product.costPrice || 0), 0)

    return {
        items: inventory,
        summary: {
            totalSKUs: inventory.length,
            lowStock: lowStock.length,
            outOfStock: outOfStock.length,
            totalRetailValue: totalValue,
            totalCostValue,
            potentialProfit: totalValue - totalCostValue,
        },
        lowStockItems: lowStock,
    }
}
