import { auth } from '@/lib/auth'
import { getInvoices } from '@/app/actions/invoice'
import { InvoiceListClient } from '@/components/invoices/InvoiceListClient'

export const metadata = {
    title: 'Invoices | PetBuddyCentral',
}

export default async function StoreInvoicesPage() {
    const session = await auth()
    const initialData = await getInvoices()

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Invoice History</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-blue">
                        {(session?.user as any)?.storeName || 'Store Manager'}
                    </span>
                </div>
            </header>

            <div className="page-body">
                <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        Sales & Invoices
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        View all invoices from your store. Filter by date, status, or payment method. Click any invoice to view details and copy share links.
                    </p>
                </div>

                <InvoiceListClient initialData={initialData} />
            </div>
        </>
    )
}
