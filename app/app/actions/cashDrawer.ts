'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ GET today's cash drawer for a store
export async function getTodayCashDrawer() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const storeId = (session.user as any).storeId
    if (!storeId) throw new Error('No store assigned')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let drawer = await prisma.cashDrawer.findFirst({
        where: {
            storeId,
            shiftDate: { gte: today },
        },
        include: { store: { select: { name: true } } },
    })

    return drawer
}

// ✅ OPEN cash drawer for today
export async function openCashDrawer(startingFloat: number) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const storeId = (session.user as any).storeId
    if (!storeId) throw new Error('No store assigned')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already opened today
    const existing = await prisma.cashDrawer.findFirst({
        where: { storeId, shiftDate: { gte: today } },
    })
    if (existing) throw new Error('Cash drawer already opened today')

    const movements = [{ type: 'FLOAT', amount: startingFloat, time: new Date().toISOString(), userId: session.user.id, note: 'Opening float' }]

    const drawer = await prisma.cashDrawer.create({
        data: {
            storeId,
            shiftDate: today,
            startingFloat,
            movements: JSON.stringify(movements),
        },
    })

    revalidatePath('/store/dashboard')
    return drawer
}

// ✅ ADD movement to cash drawer (cash in, cash out, sale)
export async function addCashMovement(drawerId: string, data: {
    type: string  // SALE, REFUND, PAID_IN, PAID_OUT
    amount: number
    note?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const drawer = await prisma.cashDrawer.findUnique({ where: { id: drawerId } })
    if (!drawer) throw new Error('Cash drawer not found')
    if (drawer.isReconciled) throw new Error('Cash drawer already reconciled')

    const movements = drawer.movements ? JSON.parse(drawer.movements) : []
    movements.push({
        type: data.type,
        amount: data.amount,
        time: new Date().toISOString(),
        userId: session.user.id,
        note: data.note || null,
    })

    // Calculate expected cash
    const expectedCash = movements.reduce((sum: number, m: any) => {
        if (['FLOAT', 'SALE', 'PAID_IN'].includes(m.type)) return sum + m.amount
        if (['REFUND', 'PAID_OUT'].includes(m.type)) return sum - m.amount
        return sum
    }, 0)

    await prisma.cashDrawer.update({
        where: { id: drawerId },
        data: {
            movements: JSON.stringify(movements),
            expectedCash,
        },
    })

    revalidatePath('/store/dashboard')
    return { movements, expectedCash }
}

// ✅ RECONCILE cash drawer (close the day)
export async function reconcileCashDrawer(drawerId: string, actualCash: number) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const drawer = await prisma.cashDrawer.findUnique({ where: { id: drawerId } })
    if (!drawer) throw new Error('Cash drawer not found')
    if (drawer.isReconciled) throw new Error('Already reconciled')

    const expectedCash = drawer.expectedCash || drawer.startingFloat
    const variance = actualCash - expectedCash

    await prisma.cashDrawer.update({
        where: { id: drawerId },
        data: {
            actualCash,
            variance,
            isReconciled: true,
        },
    })

    revalidatePath('/store/dashboard')
    return { expectedCash, actualCash, variance }
}

// ✅ GET cash drawer history
export async function getCashDrawerHistory(params?: { days?: number }) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const storeId = (session.user as any).storeId
    if (!storeId) throw new Error('No store assigned')

    const days = params?.days || 30
    const start = new Date()
    start.setDate(start.getDate() - days)

    return prisma.cashDrawer.findMany({
        where: { storeId, shiftDate: { gte: start } },
        include: { store: { select: { name: true } } },
        orderBy: { shiftDate: 'desc' },
    })
}
