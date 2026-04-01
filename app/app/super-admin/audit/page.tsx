import { getAuditLogs } from '@/app/actions/audit'
import { AuditLogClient } from '@/components/audit/AuditLogClient'

export const metadata = { title: 'Audit Log | PetBuddyCentral' }

export default async function AuditLogPage() {
    const logs = await getAuditLogs({ limit: 200 })

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Audit Log</h1>
                <span className="badge badge-teal">Super Admin</span>
            </header>
            <div className="page-body">
                <AuditLogClient logs={logs} />
            </div>
        </>
    )
}
