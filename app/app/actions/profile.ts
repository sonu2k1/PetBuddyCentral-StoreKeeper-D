'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

// ✅ Update personal profile (Name)
export async function updateProfile(data: { name: string }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const { name } = data
    if (!name || name.trim().length < 2) throw new Error('Name must be at least 2 characters')

    await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
    })

    // To properly update session name, NextAuth would need jwt callback handling,
    // but DB update will reflect on next login.
    revalidatePath('/', 'layout')

    return { success: true }
}

// ✅ Change Password
export async function changePassword(data: { currentPassword?: string; newPassword: string }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const { currentPassword, newPassword } = data
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    })

    if (!user) throw new Error('User not found')

    // Verify current password if user has one
    if (user.passwordHash && currentPassword) {
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!isValid) throw new Error('Current password is incorrect')
    } else if (user.passwordHash && !currentPassword) {
        throw new Error('Current password is required')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hashedPassword },
    })

    return { success: true }
}
