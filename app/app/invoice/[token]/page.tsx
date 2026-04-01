import { getInvoiceByToken } from '@/app/actions/invoice'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface InvoicePageProps {
    params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: InvoicePageProps) {
    const { token } = await params
    try {
        const invoice = await getInvoiceByToken(token)
        return {
            title: `Invoice ${invoice.invoiceNumber} | PetBuddyCentral`,
        }
    } catch {
        return { title: 'Invoice Not Found' }
    }
}

export default async function PublicInvoicePage({ params }: InvoicePageProps) {
    const { token } = await params

    let invoice: any
    try {
        invoice = await getInvoiceByToken(token)
    } catch {
        return (
            <div className="invoice-page">
                <div className="invoice-container">
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Invoice Not Found</h1>
                        <p style={{ color: '#666' }}>This invoice link may be invalid or expired.</p>
                    </div>
                </div>
            </div>
        )
    }

    const gstRate = invoice.taxRate / 2

    return (
        <div className="invoice-page">
            <div className="invoice-container">
                {/* Header */}
                <div className="invoice-header">
                    <div>
                        <h1 className="invoice-org-name">{invoice.store.org.name}</h1>
                        <p className="invoice-store-info">
                            {invoice.store.name} · {invoice.store.address}, {invoice.store.city}
                        </p>
                        {invoice.store.gstNumber && (
                            <p className="invoice-gst">GSTIN: {invoice.store.gstNumber}</p>
                        )}
                    </div>
                    <div className="invoice-title-block">
                        <h2 className="invoice-title">TAX INVOICE</h2>
                        <p className="invoice-number">{invoice.invoiceNumber}</p>
                        <p className="invoice-date">{formatDateTime(invoice.createdAt)}</p>
                    </div>
                </div>

                {/* Customer & Payment Info */}
                <div className="invoice-meta">
                    <div>
                        <h3 className="invoice-meta-label">Bill To</h3>
                        {invoice.customer ? (
                            <>
                                <p className="invoice-meta-value">{invoice.customer.name}</p>
                                <p className="invoice-meta-sub">{invoice.customer.phone}</p>
                            </>
                        ) : (
                            <p className="invoice-meta-value">Walk-in Customer</p>
                        )}
                    </div>
                    <div>
                        <h3 className="invoice-meta-label">Payment</h3>
                        <p className="invoice-meta-value">{invoice.paymentMethod}</p>
                        <p className="invoice-meta-sub">
                            Status: <strong>{invoice.status}</strong>
                        </p>
                    </div>
                    <div>
                        <h3 className="invoice-meta-label">Cashier</h3>
                        <p className="invoice-meta-value">{invoice.createdBy.name}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>SKU</th>
                            <th className="text-right">Rate</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: any, i: number) => (
                            <tr key={item.id}>
                                <td>{i + 1}</td>
                                <td>{item.product.name}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.product.sku}</td>
                                <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="invoice-totals">
                    <div className="invoice-totals-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="invoice-totals-row" style={{ color: '#2aaa8a' }}>
                            <span>Discount</span>
                            <span>-{formatCurrency(invoice.discount)}</span>
                        </div>
                    )}
                    <div className="invoice-totals-row">
                        <span>CGST ({gstRate}%)</span>
                        <span>{formatCurrency(invoice.taxAmount / 2)}</span>
                    </div>
                    <div className="invoice-totals-row">
                        <span>SGST ({gstRate}%)</span>
                        <span>{formatCurrency(invoice.taxAmount / 2)}</span>
                    </div>
                    <div className="invoice-totals-row invoice-totals-row--grand">
                        <span>Grand Total</span>
                        <span>{formatCurrency(invoice.total)}</span>
                    </div>
                </div>

                {/* Footer */}
                {invoice.notes && (
                    <div className="invoice-notes">
                        <strong>Notes:</strong> {invoice.notes}
                    </div>
                )}
                <div className="invoice-footer">
                    <p>Thank you for shopping at {invoice.store.org.name}! 🐾</p>
                    <p style={{ fontSize: '11px', marginTop: '4px' }}>
                        This is a computer-generated invoice and does not require a signature.
                    </p>
                </div>
            </div>
        </div>
    )
}
