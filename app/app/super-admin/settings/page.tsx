import { auth } from '@/lib/auth'
import { getOrgSettings } from '@/app/actions/settings'
import { SuperAdminSettingsClient } from '@/components/settings/SuperAdminSettingsClient'
import { ProfileSettingsClient } from '@/components/profile/ProfileSettingsClient'

export const metadata = { title: 'Settings | PetBuddyCentral' }

export default async function SettingsPage() {
    const session = await auth()
    const org = await getOrgSettings()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Organization Settings</h1>
                <span className="badge badge-teal">Super Admin</span>
            </header>
            <div className="page-body">
                <SuperAdminSettingsClient org={org} />

                <div style={{ marginTop: 'var(--space-8)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>My Profile</h2>
                    <ProfileSettingsClient initialName={session?.user?.name || ''} />
                </div>
            </div>
        </>
    )
}
