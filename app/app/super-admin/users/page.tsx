import { auth } from '@/lib/auth'
import { getUsers } from '@/app/actions/user'
import { getStores } from '@/app/actions/store'
import { UsersClient } from '@/components/users/UsersClient'

export const metadata = { title: 'Users | PetBuddyCentral' }

export default async function SuperAdminUsersPage() {
    const session = await auth()
    const [users, stores] = await Promise.all([getUsers(), getStores()])

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">User Management</h1>
                <span className="badge badge-teal">Super Admin</span>
            </header>
            <div className="page-body">
                <UsersClient users={users} stores={stores} />
            </div>
        </>
    )
}
