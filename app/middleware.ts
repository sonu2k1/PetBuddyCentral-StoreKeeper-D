import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ROLE_DASHBOARDS: Record<string, string> = {
    SUPER_ADMIN: '/super-admin/dashboard',
    FRANCHISE_OWNER: '/franchise/dashboard',
    STORE_MANAGER: '/store/dashboard',
}

const ROLE_PREFIXES: Record<string, string> = {
    SUPER_ADMIN: '/super-admin',
    FRANCHISE_OWNER: '/franchise',
    STORE_MANAGER: '/store',
}

const PUBLIC_PATHS = ['/login', '/api/auth', '/invoice']

export default auth((req) => {
    const { pathname } = req.nextUrl
    const session = req.auth

    // Allow public paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        // If logged in and on login page, redirect to dashboard
        if (pathname === '/login' && session?.user) {
            const role = (session.user as any).role as string
            const dashboard = ROLE_DASHBOARDS[role] || '/'
            return NextResponse.redirect(new URL(dashboard, req.url))
        }
        return NextResponse.next()
    }

    // Allow static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    // Not logged in → redirect to login
    if (!session?.user) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = (session.user as any).role as string

    // Root path → redirect to role dashboard
    if (pathname === '/') {
        const dashboard = ROLE_DASHBOARDS[role] || '/login'
        return NextResponse.redirect(new URL(dashboard, req.url))
    }

    // Check if user is accessing their allowed routes
    const allowedPrefix = ROLE_PREFIXES[role]
    if (allowedPrefix && !pathname.startsWith(allowedPrefix) && !pathname.startsWith('/api')) {
        // Redirect to their own dashboard if accessing unauthorized area
        const dashboard = ROLE_DASHBOARDS[role] || '/'
        return NextResponse.redirect(new URL(dashboard, req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|icons).*)'],
}
