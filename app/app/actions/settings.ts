'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ GET organization settings
export async function getOrgSettings() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            _count: { select: { stores: true, users: true, products: true, customers: true } },
        },
    })
    if (!org) throw new Error('Organization not found')
    return org
}

// ✅ UPDATE organization settings
export async function updateOrgSettings(data: {
    name?: string
    email?: string
    phone?: string
    website?: string
    gstNumber?: string
    settings?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId
    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') throw new Error('Only Super Admin can update org settings')

    const updated = await prisma.organization.update({
        where: { id: orgId },
        data,
    })

    revalidatePath('/super-admin/settings')
    revalidatePath('/franchise/settings')
    return updated
}

// ✅ GET store settings
export async function getStoreSettings(storeId?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId
    const userStoreId = (session.user as any).storeId

    const id = storeId || userStoreId
    if (!id) throw new Error('No store specified')

    const store = await prisma.store.findUnique({
        where: { id },
        include: {
            _count: { select: { users: true, invoices: true, inventory: true } },
            org: { select: { name: true, gstNumber: true } },
        },
    })

    if (!store || store.orgId !== orgId) throw new Error('Store not found')
    return store
}

// ✅ UPDATE store settings
export async function updateStoreSettings(storeId: string, data: {
    phone?: string
    settings?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store || store.orgId !== orgId) throw new Error('Store not found')

    const updated = await prisma.store.update({
        where: { id: storeId },
        data,
    })

    revalidatePath('/store/settings')
    return updated
}
