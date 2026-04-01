'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ GET Customers (paginated, searchable)
export async function getCustomers(params?: {
    search?: string
    page?: number
    limit?: number
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId
    const { search = '', page = 1, limit = 50 } = params || {}

    const where = {
        orgId,
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {}),
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            include: {
                pets: true,
                _count: { select: { invoices: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.customer.count({ where }),
    ])

    return {
        customers,
        total,
        pages: Math.ceil(total / limit),
    }
}

// ✅ GET Single Customer with pets and recent invoices
export async function getCustomer(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            pets: true,
            invoices: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    store: true,
                    items: { include: { product: true } },
                },
            },
        },
    })

    if (!customer || customer.orgId !== orgId) {
        throw new Error('Customer not found')
    }

    return customer
}

// ✅ SEARCH Customers (lightweight, for POS picker)
export async function searchCustomers(query: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    if (!query || query.length < 2) return []

    const customers = await prisma.customer.findMany({
        where: {
            orgId,
            OR: [
                { name: { contains: query } },
                { phone: { contains: query } },
            ],
        },
        select: {
            id: true,
            name: true,
            phone: true,
            loyaltyTier: true,
            loyaltyPoints: true,
            pets: true,
        },
        take: 10,
    })

    return customers
}

// ✅ CREATE Customer
export async function createCustomer(data: {
    name: string
    phone: string
    email?: string
    address?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    // Check duplicate phone per org
    const existing = await prisma.customer.findFirst({
        where: { orgId, phone: data.phone },
    })
    if (existing) {
        throw new Error('A customer with this phone number already exists')
    }

    const customer = await prisma.customer.create({
        data: {
            ...data,
            orgId,
        },
    })

    revalidatePath('/franchise/customers')
    revalidatePath('/store/customers')
    return customer
}

// ✅ UPDATE Customer
export async function updateCustomer(
    id: string,
    data: {
        name?: string
        phone?: string
        email?: string
        address?: string
        notes?: string
        tags?: string
    }
) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer || customer.orgId !== orgId) throw new Error('Customer not found')

    if (data.phone && data.phone !== customer.phone) {
        const existing = await prisma.customer.findFirst({
            where: { orgId, phone: data.phone },
        })
        if (existing) throw new Error('A customer with this phone number already exists')
    }

    const updated = await prisma.customer.update({
        where: { id },
        data,
    })

    revalidatePath('/franchise/customers')
    revalidatePath('/store/customers')
    return updated
}
