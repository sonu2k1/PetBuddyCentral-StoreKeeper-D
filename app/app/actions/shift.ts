'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ GET current active shift for logged-in user
export async function getActiveShift() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const shift = await prisma.shift.findFirst({
        where: {
            userId: session.user.id,
            clockOut: null,
        },
        include: {
            store: { select: { name: true, code: true } },
            user: { select: { name: true } },
        },
    })

    return shift
}

// ✅ GET shift history for user or store
export async function getShiftHistory(params?: { storeId?: string; days?: number }) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const storeId = params?.storeId || (session.user as any).storeId
    const days = params?.days || 7

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const shifts = await prisma.shift.findMany({
        where: {
            storeId,
            clockIn: { gte: startDate },
        },
        include: {
            user: { select: { name: true, email: true, role: true } },
            store: { select: { name: true, code: true } },
        },
        orderBy: { clockIn: 'desc' },
    })

    return shifts
}

// ✅ CLOCK IN
export async function clockIn(notes?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const storeId = (session.user as any).storeId
    if (!storeId) throw new Error('No store assigned — cannot clock in')

    // Check for existing active shift
    const userId = session.user.id
    if (!userId) throw new Error('Invalid user session')

    const existing = await prisma.shift.findFirst({
        where: { userId, clockOut: null },
    })
    if (existing) throw new Error('Already clocked in — please clock out first')

    const shift = await prisma.shift.create({
        data: {
            userId,
            storeId,
            clockIn: new Date(),
            notes: notes || null,
        },
    })

    revalidatePath('/store/dashboard')
    revalidatePath('/store/pos')
    return shift
}

// ✅ CLOCK OUT
export async function clockOut(shiftId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift) throw new Error('Shift not found')
    if (shift.userId !== session.user.id) throw new Error('This is not your shift')
    if (shift.clockOut) throw new Error('Already clocked out')

    const updated = await prisma.shift.update({
        where: { id: shiftId },
        data: { clockOut: new Date() },
    })

    revalidatePath('/store/dashboard')
    revalidatePath('/store/pos')
    return updated
}

// ✅ ADD BREAK to shift
export async function addBreak(shiftId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift || shift.userId !== session.user.id) throw new Error('Invalid shift')

    const breaks = shift.breaks ? JSON.parse(shift.breaks) : []
    breaks.push({ start: new Date().toISOString(), end: null, paid: false })

    await prisma.shift.update({
        where: { id: shiftId },
        data: { breaks: JSON.stringify(breaks) },
    })

    revalidatePath('/store/dashboard')
    return breaks
}

// ✅ END BREAK
export async function endBreak(shiftId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift || shift.userId !== session.user.id) throw new Error('Invalid shift')

    const breaks = shift.breaks ? JSON.parse(shift.breaks) : []
    const lastBreak = breaks[breaks.length - 1]
    if (!lastBreak || lastBreak.end) throw new Error('No active break')
    lastBreak.end = new Date().toISOString()

    await prisma.shift.update({
        where: { id: shiftId },
        data: { breaks: JSON.stringify(breaks) },
    })

    revalidatePath('/store/dashboard')
    return breaks
}
