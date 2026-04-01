'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Types
type GetProductsParams = {
    search?: string
    categoryId?: string
    page?: number
    limit?: number
}

// ✅ GET Products (Global Catalog)
export async function getProducts(params?: GetProductsParams) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId
    const { search = '', categoryId, page = 1, limit = 50 } = params || {}

    const where = {
        orgId,
        isDeleted: false, // Exclude soft-deleted products
        ...(search
            ? {
                OR: [
                    { name: { contains: search } }, // SQLite search is case-insensitive by default with `contains`
                    { sku: { contains: search } },
                ],
            }
            : {}),
        ...(categoryId ? { categoryId } : {}),
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.product.count({ where }),
    ])

    return {
        products,
        total,
        pages: Math.ceil(total / limit),
    }
}

// ✅ GET Single Product
export async function getProduct(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    const product = await prisma.product.findUnique({
        where: { id, isDeleted: false },
        include: {
            category: true,
            inventory: {
                include: {
                    store: true,
                },
            },
        },
    })

    // Ensure cross-tenant safety
    if (!product || product.orgId !== orgId) {
        throw new Error('Product not found')
    }

    return product
}

// ✅ CREATE Product (Super Admin Only)
export async function createProduct(data: {
    categoryId: string
    sku: string
    name: string
    description?: string
    unit: string
    price: number
    costPrice?: number | null
    imageUrl?: string
    allowFractionalQuantity?: boolean
}) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Only Super Admins can manage the global catalog')
    }

    const orgId = (session.user as any).orgId

    // Check unique SKU per org
    const existing = await prisma.product.findFirst({
        where: { orgId, sku: data.sku },
    })
    if (existing) {
        throw new Error('A product with this SKU already exists')
    }

    const product = await prisma.product.create({
        data: {
            ...data,
            orgId,
        },
    })

    revalidatePath('/super-admin/products')
    return product
}

// ✅ UPDATE Product (Super Admin Only)
export async function updateProduct(
    id: string,
    data: Partial<Parameters<typeof createProduct>[0]>
) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized')
    }

    const orgId = (session.user as any).orgId

    // Security check
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product || product.orgId !== orgId) throw new Error('Product not found')

    if (data.sku && data.sku !== product.sku) {
        const existing = await prisma.product.findFirst({
            where: { orgId, sku: data.sku },
        })
        if (existing) throw new Error('A product with this SKU already exists')
    }

    const updated = await prisma.product.update({
        where: { id },
        data,
    })

    revalidatePath('/super-admin/products')
    revalidatePath(`/super-admin/products/${id}`)
    return updated
}

// ✅ DELETE Product (Soft Delete — Super Admin Only)
export async function deleteProduct(id: string) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized')
    }

    const orgId = (session.user as any).orgId

    const product = await prisma.product.findUnique({
        where: { id },
        include: { inventory: true, invoiceItems: true },
    })

    if (!product || product.orgId !== orgId) throw new Error('Product not found')
    if (product.isDeleted) throw new Error('Product is already deleted')

    // Warn about active invoices (product will be soft-deleted, references stay intact)
    const hasInvoices = product.invoiceItems.length > 0
    const hasStock = product.inventory.some((inv) => inv.quantity > 0)

    // Soft delete — mark as deleted, keep data for historical integrity
    await prisma.product.update({
        where: { id },
        data: {
            isDeleted: true,
            isActive: false, // Also mark inactive
        },
    })

    revalidatePath('/super-admin/products')
    return {
        success: true,
        warnings: [
            ...(hasInvoices ? ['This product has been billed in existing invoices. Invoice history is preserved.'] : []),
            ...(hasStock ? ['This product had active stock in one or more stores. Inventory records are preserved.'] : []),
        ],
    }
}
