'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from './audit'

// ✅ GET all stores in org
export async function getStores() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const stores = await prisma.store.findMany({
        where: { orgId },
        include: {
            _count: { select: { users: true, invoices: true, inventory: true } },
        },
        orderBy: { createdAt: 'asc' },
    })

    return stores
}

// ✅ GET single store with details
export async function getStore(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const store = await prisma.store.findUnique({
        where: { id },
        include: {
            users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
            _count: { select: { invoices: true, inventory: true } },
        },
    })

    if (!store || store.orgId !== orgId) throw new Error('Store not found')
    return store
}

// ✅ CREATE a new store
export async function createStore(data: {
    name: string
    code: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    gstNumber?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId
    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') throw new Error('Only Super Admin can create stores')

    const store = await prisma.store.create({
        data: {
            orgId,
            name: data.name,
            code: data.code.toUpperCase(),
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            phone: data.phone,
            gstNumber: data.gstNumber || null,
        },
    })

    revalidatePath('/super-admin/stores')

    await logAuditEvent({
        action: 'CREATE_STORE',
        entity: 'Store',
        entityId: store.id,
        details: JSON.stringify({ name: store.name, code: store.code }),
    })

    return store
}

// ✅ UPDATE store
export async function updateStore(id: string, data: {
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    gstNumber?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const store = await prisma.store.findUnique({ where: { id } })
    if (!store || store.orgId !== orgId) throw new Error('Store not found')

    const updated = await prisma.store.update({
        where: { id },
        data,
    })

    revalidatePath('/super-admin/stores')
    return updated
}

// ✅ TOGGLE store active/inactive
export async function toggleStoreActive(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const store = await prisma.store.findUnique({ where: { id } })
    if (!store || store.orgId !== orgId) throw new Error('Store not found')

    const updated = await prisma.store.update({
        where: { id },
        data: { isActive: !store.isActive },
    })

    revalidatePath('/super-admin/stores')
    return updated
}
