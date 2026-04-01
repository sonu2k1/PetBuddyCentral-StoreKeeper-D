'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { logAuditEvent } from './audit'

// ✅ GET all users in org
export async function getUsers() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const users = await prisma.user.findMany({
        where: { orgId },
        include: {
            store: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'asc' },
    })

    // Strip password hashes
    return users.map(({ passwordHash, pin, ...user }) => user)
}

// ✅ CREATE user
export async function createUser(data: {
    name: string
    email: string
    password: string
    role: string
    storeId?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId
    const callerRole = (session.user as any).role
    if (callerRole !== 'SUPER_ADMIN') throw new Error('Only Super Admin can create users')

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
        data: {
            orgId,
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            storeId: data.storeId || null,
        },
    })

    revalidatePath('/super-admin/users')

    await logAuditEvent({
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user.id,
        details: JSON.stringify({ name: user.name, role: user.role }),
    })

    return { id: user.id, name: user.name, email: user.email, role: user.role }
}

// ✅ UPDATE user
export async function updateUser(id: string, data: {
    name?: string
    email?: string
    role?: string
    storeId?: string | null
    password?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.orgId !== orgId) throw new Error('User not found')

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.storeId !== undefined) updateData.storeId = data.storeId || null
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12)

    const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true },
    })

    revalidatePath('/super-admin/users')
    return updated
}

// ✅ TOGGLE user active
export async function toggleUserActive(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const orgId = (session.user as any).orgId

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.orgId !== orgId) throw new Error('User not found')

    // Prevent deactivating yourself
    if (user.id === session.user.id) throw new Error('Cannot deactivate yourself')

    const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
    })

    revalidatePath('/super-admin/users')
    return updated
}
