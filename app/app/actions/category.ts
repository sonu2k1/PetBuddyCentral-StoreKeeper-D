'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCategories() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    return prisma.category.findMany({
        where: { orgId },
        orderBy: { sortOrder: 'asc' },
    })
}

export async function createCategory(data: {
    name: string
    description?: string
    icon?: string
}) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized')
    }

    const orgId = (session.user as any).orgId

    // Get next sort order
    const lastCategory = await prisma.category.findFirst({
        where: { orgId },
        orderBy: { sortOrder: 'desc' },
    })
    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1

    const category = await prisma.category.create({
        data: {
            ...data,
            orgId,
            sortOrder: nextSortOrder,
        },
    })

    revalidatePath('/super-admin/products')
    return category
}
