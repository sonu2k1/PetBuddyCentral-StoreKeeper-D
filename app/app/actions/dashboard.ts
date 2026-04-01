'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// ✅ Super Admin Dashboard — org-wide metrics
export async function getSuperAdminDashboard() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // All stores in org
    const stores = await prisma.store.findMany({
        where: { orgId, isActive: true },
        select: { id: true, name: true, code: true },
    })

    const storeIds = stores.map((s) => s.id)

    // Run aggregation queries in parallel
    const [
        totalProducts,
        totalCustomers,
        allInvoices,
        todayInvoices,
        lowStockCount,
    ] = await Promise.all([
        prisma.product.count({ where: { orgId, isActive: true } }),
        prisma.customer.count({ where: { orgId } }),
        prisma.invoice.findMany({
            where: { storeId: { in: storeIds } },
            select: { total: true, storeId: true, createdAt: true },
        }),
        prisma.invoice.findMany({
            where: {
                storeId: { in: storeIds },
                createdAt: { gte: todayStart },
            },
            select: { total: true, storeId: true },
        }),
        prisma.storeInventory.count({
            where: {
                storeId: { in: storeIds },
                quantity: { lte: 10 }, // below or at threshold
            },
        }),
    ])

    // Calculate revenue
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const todayOrderCount = todayInvoices.length

    // Per-store breakdown
    const storePerformance = stores.map((store) => {
        const storeInvoices = allInvoices.filter((i) => i.storeId === store.id)
        const storeRevenue = storeInvoices.reduce((sum, inv) => sum + inv.total, 0)
        const storeTodayInvoices = todayInvoices.filter((i) => i.storeId === store.id)
        const storeTodayRevenue = storeTodayInvoices.reduce((sum, inv) => sum + inv.total, 0)

        return {
            id: store.id,
            name: store.name,
            code: store.code,
            totalRevenue: storeRevenue,
            todayRevenue: storeTodayRevenue,
            invoiceCount: storeInvoices.length,
            todayOrders: storeTodayInvoices.length,
        }
    })

    return {
        totalRevenue,
        todayRevenue,
        todayOrderCount,
        totalProducts,
        totalCustomers,
        activeStores: stores.length,
        lowStockCount,
        storePerformance,
    }
}

// ✅ Franchise Dashboard — store-level metrics
export async function getFranchiseDashboard() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId
    const storeId = (session.user as any).storeId

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get stores for this owner
    const stores = await prisma.store.findMany({
        where: { orgId, isActive: true },
        select: { id: true, name: true, code: true },
    })

    const storeIds = stores.map((s) => s.id)

    const [invoices, todayInvoices, lowStockItems, totalProducts] = await Promise.all([
        prisma.invoice.findMany({
            where: { storeId: { in: storeIds } },
            select: { total: true, storeId: true, createdAt: true },
        }),
        prisma.invoice.findMany({
            where: {
                storeId: { in: storeIds },
                createdAt: { gte: todayStart },
            },
            select: { total: true },
        }),
        prisma.storeInventory.findMany({
            where: {
                storeId: { in: storeIds },
                quantity: { lte: 10 },
            },
            include: { product: true, store: true },
            take: 10,
        }),
        prisma.product.count({ where: { orgId, isActive: true } }),
    ])

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0)

    return {
        totalRevenue,
        todayRevenue,
        todayOrders: todayInvoices.length,
        totalInvoices: invoices.length,
        totalProducts,
        lowStockItems,
        stores,
    }
}

// ✅ Store Manager Dashboard — daily operational metrics
export async function getStoreDashboard() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const storeId = (session.user as any).storeId
    if (!storeId) throw new Error('No store assigned')

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const [
        todayInvoices,
        weekInvoices,
        lowStockItems,
        totalCustomers,
    ] = await Promise.all([
        prisma.invoice.findMany({
            where: { storeId, createdAt: { gte: todayStart } },
            include: { items: { include: { product: true } }, customer: true },
        }),
        prisma.invoice.findMany({
            where: { storeId, createdAt: { gte: weekStart } },
            select: { total: true, createdAt: true },
        }),
        prisma.storeInventory.findMany({
            where: { storeId, quantity: { lte: 10 } },
            include: { product: true },
            take: 5,
            orderBy: { quantity: 'asc' },
        }),
        prisma.customer.count({ where: { orgId: (session.user as any).orgId } }),
    ])

    const todayRevenue = todayInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
    const todayOrderCount = todayInvoices.length
    const weekRevenue = weekInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0)

    // Top products today
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    for (const invoice of todayInvoices) {
        for (const item of invoice.items) {
            const key = item.productId
            if (!productSales[key]) {
                productSales[key] = { name: item.product.name, quantity: 0, revenue: 0 }
            }
            productSales[key].quantity += item.quantity
            productSales[key].revenue += item.total
        }
    }

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

    // Recent invoices
    const recentInvoices = todayInvoices
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            total: inv.total,
            customerName: inv.customer?.name || 'Walk-in',
            time: inv.createdAt,
        }))

    return {
        todayRevenue,
        todayOrderCount,
        weekRevenue,
        weekOrderCount: weekInvoices.length,
        lowStockItems,
        totalCustomers,
        topProducts,
        recentInvoices,
    }
}
