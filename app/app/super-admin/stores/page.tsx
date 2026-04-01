import { auth } from '@/lib/auth'
import { getStores } from '@/app/actions/store'
import { StoresClient } from '@/components/stores/StoresClient'

export const metadata = { title: 'Stores | PetBuddyCentral' }

export default async function SuperAdminStoresPage() {
    const session = await auth()
    const stores = await getStores()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Store Management</h1>
                <span className="badge badge-teal">Super Admin</span>
            </header>
            <div className="page-body">
                <StoresClient stores={stores} />
            </div>
        </>
    )
}
