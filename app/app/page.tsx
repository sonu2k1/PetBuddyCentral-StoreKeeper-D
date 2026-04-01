import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

const ROLE_DASHBOARDS: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  FRANCHISE_OWNER: '/franchise/dashboard',
  STORE_MANAGER: '/store/dashboard',
}

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role as string
  const dashboard = ROLE_DASHBOARDS[role] || '/login'
  redirect(dashboard)
}
