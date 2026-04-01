'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ GET all suppliers
export async function getSuppliers() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    return prisma.supplier.findMany({
        where: { orgId },
        include: { _count: { select: { purchaseOrders: true } } },
        orderBy: { name: 'asc' },
    })
}

// ✅ CREATE supplier
export async function createSupplier(data: {
    name: string
    phone?: string
    email?: string
    address?: string
    leadTimeDays?: number
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const supplier = await prisma.supplier.create({
        data: {
            orgId,
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            leadTimeDays: data.leadTimeDays ?? 7,
        },
    })

    revalidatePath('/franchise/purchase-orders')
    return supplier
}

// ✅ UPDATE supplier
export async function updateSupplier(id: string, data: {
    name?: string
    phone?: string
    email?: string
    address?: string
    leadTimeDays?: number
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const supplier = await prisma.supplier.findUnique({ where: { id } })
    if (!supplier || supplier.orgId !== orgId) throw new Error('Supplier not found')

    const updated = await prisma.supplier.update({ where: { id }, data })
    revalidatePath('/franchise/purchase-orders')
    return updated
}
