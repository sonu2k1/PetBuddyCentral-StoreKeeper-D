'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ✅ ADD Pet to Customer
export async function addPet(data: {
    customerId: string
    name: string
    type: string
    breed?: string
    birthday?: string
    weight?: number
    dietaryNeeds?: string[]
    medicalConditions?: string[]
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    // Verify customer belongs to org
    const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
    })
    if (!customer || customer.orgId !== orgId) throw new Error('Customer not found')

    const pet = await prisma.pet.create({
        data: {
            customerId: data.customerId,
            name: data.name,
            type: data.type,
            breed: data.breed || null,
            birthday: data.birthday ? new Date(data.birthday) : null,
            weight: data.weight || null,
            dietaryNeeds: JSON.stringify(data.dietaryNeeds || []),
            medicalConditions: JSON.stringify(data.medicalConditions || []),
        },
    })

    revalidatePath('/franchise/customers')
    revalidatePath('/store/customers')
    return pet
}

// ✅ UPDATE Pet
export async function updatePet(
    id: string,
    data: {
        name?: string
        type?: string
        breed?: string
        birthday?: string
        weight?: number
        dietaryNeeds?: string[]
        medicalConditions?: string[]
    }
) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    // Verify pet's customer belongs to org
    const pet = await prisma.pet.findUnique({
        where: { id },
        include: { customer: true },
    })
    if (!pet || pet.customer.orgId !== orgId) throw new Error('Pet not found')

    const updated = await prisma.pet.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.type !== undefined && { type: data.type }),
            ...(data.breed !== undefined && { breed: data.breed }),
            ...(data.birthday !== undefined && { birthday: new Date(data.birthday) }),
            ...(data.weight !== undefined && { weight: data.weight }),
            ...(data.dietaryNeeds !== undefined && {
                dietaryNeeds: JSON.stringify(data.dietaryNeeds),
            }),
            ...(data.medicalConditions !== undefined && {
                medicalConditions: JSON.stringify(data.medicalConditions),
            }),
        },
    })

    revalidatePath('/franchise/customers')
    revalidatePath('/store/customers')
    return updated
}

// ✅ DELETE Pet
export async function deletePet(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const orgId = (session.user as any).orgId

    const pet = await prisma.pet.findUnique({
        where: { id },
        include: { customer: true },
    })
    if (!pet || pet.customer.orgId !== orgId) throw new Error('Pet not found')

    await prisma.pet.delete({ where: { id } })

    revalidatePath('/franchise/customers')
    revalidatePath('/store/customers')
    return { success: true }
}
