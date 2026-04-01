'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ✅ LOG an audit event
export async function logAuditEvent(data: {
    action: string    // CREATE_INVOICE, ADJUST_STOCK, CREATE_USER, etc.
    entity: string    // Invoice, Product, User, etc.
    entityId: string
    details?: string  // JSON string with extra info
}) {
    try {
        const session = await auth()
        if (!session?.user?.id) return // silently fail if no session

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                details: data.details || null,
                ipAddress: null, // can be populated from headers in the future
            },
        })
    } catch {
        // Audit logging should never break the main flow
        console.error('Audit log failed')
    }
}

// ✅ GET audit logs
export async function getAuditLogs(params?: {
    limit?: number
    userId?: string
    entity?: string
    action?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') throw new Error('Only Super Admin can view audit logs')

    const where: any = {}
    if (params?.userId) where.userId = params.userId
    if (params?.entity) where.entity = params.entity
    if (params?.action) where.action = params.action

    return prisma.auditLog.findMany({
        where,
        include: {
            user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params?.limit || 100,
    })
}
