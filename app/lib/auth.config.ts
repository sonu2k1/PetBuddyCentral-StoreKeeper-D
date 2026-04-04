import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnLogin = nextUrl.pathname === '/login'
            const isPublic = nextUrl.pathname.startsWith('/api/auth') ||
                nextUrl.pathname.startsWith('/invoice')

            if (isPublic) return true

            if (isOnLogin) {
                if (isLoggedIn) {
                    const role = (auth.user as any).role as string
                    const dashboards: Record<string, string> = {
                        SUPER_ADMIN: '/super-admin/dashboard',
                        FRANCHISE_OWNER: '/franchise/dashboard',
                        STORE_MANAGER: '/store/dashboard',
                    }
                    return Response.redirect(new URL(dashboards[role] || '/', nextUrl))
                }
                return true // Allow access to login page
            }

            return isLoggedIn // Redirect to login if not logged in
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.orgId = (user as any).orgId
                token.orgName = (user as any).orgName
                token.storeId = (user as any).storeId
                token.storeName = (user as any).storeName
                token.avatarUrl = (user as any).avatarUrl
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!
                    ; (session.user as any).role = token.role
                    ; (session.user as any).orgId = token.orgId
                    ; (session.user as any).orgName = token.orgName
                    ; (session.user as any).storeId = token.storeId
                    ; (session.user as any).storeName = token.storeName
                    ; (session.user as any).avatarUrl = token.avatarUrl
            }
            return session
        },
    },
} satisfies NextAuthConfig
