import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: { org: true, store: true },
                })

                if (!user || !user.isActive) {
                    throw new Error('Invalid credentials')
                }

                const isValidPassword = await compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!isValidPassword) {
                    throw new Error('Invalid credentials')
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    orgId: user.orgId,
                    orgName: user.org.name,
                    storeId: user.storeId,
                    storeName: user.store?.name || null,
                    avatarUrl: user.avatarUrl,
                }
            },
        }),
    ],
})

// Role-based redirect paths
export const ROLE_DASHBOARDS: Record<string, string> = {
    SUPER_ADMIN: '/super-admin/dashboard',
    FRANCHISE_OWNER: '/franchise/dashboard',
    STORE_MANAGER: '/store/dashboard',
}

// Allowed route prefixes per role
export const ROLE_ROUTES: Record<string, string[]> = {
    SUPER_ADMIN: ['/super-admin', '/api'],
    FRANCHISE_OWNER: ['/franchise', '/api'],
    STORE_MANAGER: ['/store', '/api'],
}
