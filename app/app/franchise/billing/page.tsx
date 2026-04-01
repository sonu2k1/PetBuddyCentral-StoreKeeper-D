import { auth } from '@/lib/auth'
import { getInvoices } from '@/app/actions/invoice'
import { InvoiceListClient } from '@/components/invoices/InvoiceListClient'

export const metadata = {
    title: 'Billing | PetBuddyCentral',
}

export default async function FranchiseBillingPage() {
    const session = await auth()
    const initialData = await getInvoices()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Billing & Invoices</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-teal">Franchise Owner</span>
                </div>
            </header>

            <div className="page-body">
                <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        Sales History
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        View all invoices across your stores. Click share links to send digital receipts to customers.
                    </p>
                </div>

                <InvoiceListClient initialData={initialData} />
            </div>
        </>
    )
}
