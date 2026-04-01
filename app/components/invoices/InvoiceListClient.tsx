'use client'

import { useState, useMemo } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import {
    Search, ExternalLink, Receipt, Copy, ChevronRight,
    Filter, X, CheckCircle, Calendar, Download, RefreshCw, XCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { refundInvoice, voidInvoice } from '@/app/actions/invoice'

interface InvoiceListProps {
    initialData: any
}

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
    COMPLETED: { className: 'badge-success', label: 'Completed' },
    REFUNDED: { className: 'badge-warning', label: 'Refunded' },
    VOIDED: { className: 'badge-danger', label: 'Voided' },
    HELD: { className: 'badge-neutral', label: 'Held' },
}

const PAYMENT_DISPLAY: Record<string, { icon: string; label: string }> = {
    CASH: { icon: '💵', label: 'Cash' },
    UPI: { icon: '📱', label: 'UPI' },
    CARD: { icon: '💳', label: 'Card' },
    MIXED: { icon: '🔀', label: 'Mixed' },
}

export function InvoiceListClient({ initialData }: InvoiceListProps) {
    const [search, setSearch] = useState('')
    const [data] = useState(initialData)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [linkCopied, setLinkCopied] = useState<string | null>(null)
    const { toast, success, error } = useToast()

    // Action states
    const [isProcessing, setIsProcessing] = useState(false)
    const [actionType, setActionType] = useState<'refund' | 'void' | null>(null)
    const [actionReason, setActionReason] = useState('')

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('')
    const [filterPayment, setFilterPayment] = useState<string>('')
    const [filterStore, setFilterStore] = useState<string>('')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')

    // Get unique stores from data
    const stores = useMemo(() => {
        const storeMap = new Map<string, string>()
        data.invoices.forEach((inv: any) => {
            if (inv.store) storeMap.set(inv.store.id, inv.store.name)
        })
        return Array.from(storeMap, ([id, name]) => ({ id, name }))
    }, [data.invoices])

    // Active filter count
    const activeFilterCount = [filterStatus, filterPayment, filterStore, filterDateFrom, filterDateTo].filter(Boolean).length

    // Apply filters
    const filteredInvoices = useMemo(() => {
        return data.invoices.filter((inv: any) => {
            // Text search
            if (search) {
                const q = search.toLowerCase()
                const matchText =
                    inv.invoiceNumber?.toLowerCase().includes(q) ||
                    inv.customer?.name?.toLowerCase().includes(q) ||
                    inv.store?.name?.toLowerCase().includes(q) ||
                    inv.createdBy?.name?.toLowerCase().includes(q)
                if (!matchText) return false
            }
            // Status filter
            if (filterStatus && inv.status !== filterStatus) return false
            // Payment filter
            if (filterPayment && inv.paymentMethod !== filterPayment) return false
            // Store filter
            if (filterStore && inv.storeId !== filterStore) return false
            // Date range
            if (filterDateFrom) {
                const from = new Date(filterDateFrom)
                if (new Date(inv.createdAt) < from) return false
            }
            if (filterDateTo) {
                const to = new Date(filterDateTo)
                to.setHours(23, 59, 59, 999)
                if (new Date(inv.createdAt) > to) return false
            }
            return true
        })
    }, [data.invoices, search, filterStatus, filterPayment, filterStore, filterDateFrom, filterDateTo])

    // Stats
    const totalRevenue = filteredInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
    const avgOrderValue = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0

    const handleCopyLink = (shareToken: string, invoiceId?: string) => {
        const url = `${window.location.origin}/invoice/${shareToken}`
        navigator.clipboard.writeText(url)
        setLinkCopied(invoiceId || shareToken)
        setTimeout(() => setLinkCopied(null), 2000)
    }

    const clearFilters = () => {
        setFilterStatus('')
        setFilterPayment('')
        setFilterStore('')
        setFilterDateFrom('')
        setFilterDateTo('')
    }

    const exportCSV = () => {
        const headers = ['Invoice #', 'Date', 'Customer', 'Items', 'Payment', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total']
        const rows = filteredInvoices.map((inv: any) => [
            inv.invoiceNumber,
            new Date(inv.createdAt).toLocaleDateString(),
            inv.customer?.name || 'Walk-in',
            inv.items?.length || 0,
            inv.paymentMethod,
            inv.status,
            inv.subtotal,
            inv.taxAmount,
            inv.discount,
            inv.total,
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleInvoiceAction = async () => {
        if (!selectedInvoice || !actionType) return
        if (!actionReason) {
            error('Please provide a reason for this action')
            return
        }

        setIsProcessing(true)
        try {
            if (actionType === 'refund') {
                await refundInvoice(selectedInvoice.id, actionReason)
                success(`Invoice ${selectedInvoice.invoiceNumber} refunded successfully`)
            } else {
                await voidInvoice(selectedInvoice.id, actionReason)
                success(`Invoice ${selectedInvoice.invoiceNumber} voided successfully`)
            }

            // Update local state to reflect the change visually before full refresh
            const updatedInvoices = data.invoices.map((inv: any) => {
                if (inv.id === selectedInvoice.id) {
                    return { ...inv, status: actionType === 'refund' ? 'REFUNDED' : 'VOIDED', notes: `${actionType.toUpperCase()}: ${actionReason}` }
                }
                return inv
            })
            // Since data is from props and we use it as state, this is a bit hacky but works for UI
            data.invoices = updatedInvoices
            setSelectedInvoice(null)
            setActionType(null)
            setActionReason('')

            // Re-fetch or rely on revalidatePath which Next.js will handle on navigation

        } catch (e: any) {
            error(e.message)
        }
        setIsProcessing(false)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                <div className="glass-card animate-in" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Invoices
                    </div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
                        {filteredInvoices.length}
                    </div>
                </div>
                <div className="glass-card animate-in animate-in-delay-1" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Total Revenue
                    </div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--pbc-teal)' }}>
                        {formatCurrency(totalRevenue)}
                    </div>
                </div>
                <div className="glass-card animate-in animate-in-delay-2" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Avg. Order Value
                    </div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
                        {formatCurrency(Math.round(avgOrderValue))}
                    </div>
                </div>
                <div className="glass-card animate-in animate-in-delay-3" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        From Total
                    </div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
                        {data.total}
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <Input
                        placeholder="Search invoice #, customer, store, or cashier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <Button
                    variant={showFilters ? 'primary' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ position: 'relative' }}
                >
                    <Filter size={16} style={{ marginRight: '6px' }} />
                    Filters
                    {activeFilterCount > 0 && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: 'var(--coral)',
                                color: 'white',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                <Button variant="outline" onClick={exportCSV} title="Export CSV">
                    <Download size={16} style={{ marginRight: '6px' }} /> Export
                </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div
                    className="glass-card animate-in"
                    style={{ padding: 'var(--space-4)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                            <Filter size={14} style={{ display: 'inline', marginRight: '6px' }} />
                            Filter Invoices
                        </h3>
                        {activeFilterCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X size={14} style={{ marginRight: '4px' }} /> Clear All
                            </Button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
                        {/* Status */}
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select
                                className="input"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="COMPLETED">✅ Completed</option>
                                <option value="HELD">⏸️ Held</option>
                                <option value="REFUNDED">↩️ Refunded</option>
                                <option value="VOIDED">❌ Voided</option>
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div className="input-group">
                            <label className="input-label">Payment</label>
                            <select
                                className="input"
                                value={filterPayment}
                                onChange={(e) => setFilterPayment(e.target.value)}
                            >
                                <option value="">All Methods</option>
                                <option value="CASH">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="CARD">💳 Card</option>
                            </select>
                        </div>

                        {/* Store (only if multiple stores) */}
                        {stores.length > 1 && (
                            <div className="input-group">
                                <label className="input-label">Store</label>
                                <select
                                    className="input"
                                    value={filterStore}
                                    onChange={(e) => setFilterStore(e.target.value)}
                                >
                                    <option value="">All Stores</option>
                                    {stores.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date From */}
                        <div className="input-group">
                            <label className="input-label">From Date</label>
                            <input
                                type="date"
                                className="input"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div className="input-group">
                            <label className="input-label">To Date</label>
                            <input
                                type="date"
                                className="input"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Table */}
            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date & Time</th>
                                {stores.length > 1 && <th>Store</th>}
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th className="text-right">Total</th>
                                <th style={{ width: '80px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={stores.length > 1 ? 9 : 8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                        <Receipt size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                                        <div style={{ marginBottom: '4px' }}>No invoices found</div>
                                        <div style={{ fontSize: 'var(--text-xs)' }}>
                                            {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Sales will appear here after POS transactions'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice: any) => {
                                    const pm = PAYMENT_DISPLAY[invoice.paymentMethod] || { icon: '', label: invoice.paymentMethod }
                                    const sb = STATUS_BADGE[invoice.status] || { className: 'badge-neutral', label: invoice.status }
                                    return (
                                        <tr
                                            key={invoice.id}
                                            onClick={() => setSelectedInvoice(invoice)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <code style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--pbc-teal)' }}>
                                                    {invoice.invoiceNumber}
                                                </code>
                                            </td>
                                            <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                {formatDateTime(invoice.createdAt)}
                                            </td>
                                            {stores.length > 1 && (
                                                <td style={{ fontSize: 'var(--text-sm)' }}>{invoice.store?.name}</td>
                                            )}
                                            <td>
                                                {invoice.customer ? (
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                                                            {invoice.customer.name}
                                                        </div>
                                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                            {invoice.customer.phone}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                                        Walk-in
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge badge-neutral">
                                                    {invoice.items?.length || 0} items
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: 'var(--text-sm)' }}>
                                                    {pm.icon} {pm.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${sb.className}`}>
                                                    {sb.label}
                                                </span>
                                            </td>
                                            <td className="text-right" style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                                                {formatCurrency(invoice.total)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleCopyLink(invoice.shareToken, invoice.id)
                                                        }}
                                                        title="Copy invoice link"
                                                        style={{ padding: '4px 6px' }}
                                                    >
                                                        {linkCopied === invoice.id ? (
                                                            <CheckCircle size={14} style={{ color: 'var(--pbc-teal)' }} />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedInvoice(invoice)
                                                        }}
                                                        title="View details"
                                                        style={{ padding: '4px 6px' }}
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Invoice Detail Modal */}
            <Modal
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                title={`Invoice ${selectedInvoice?.invoiceNumber || ''}`}
                maxWidth="650px"
            >
                {selectedInvoice && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                        {/* Header Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '2px' }}>Date</div>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    {formatDateTime(selectedInvoice.createdAt)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '2px' }}>Customer</div>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                    {selectedInvoice.customer?.name || 'Walk-in Customer'}
                                </div>
                                {selectedInvoice.customer?.phone && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        {selectedInvoice.customer.phone}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '2px' }}>Cashier</div>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                    {selectedInvoice.createdBy?.name || 'Unknown'}
                                </div>
                            </div>
                        </div>

                        {/* Status & Payment */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <span className={`badge ${STATUS_BADGE[selectedInvoice.status]?.className || 'badge-neutral'}`}>
                                {STATUS_BADGE[selectedInvoice.status]?.label || selectedInvoice.status}
                            </span>
                            <span className="badge badge-neutral">
                                {PAYMENT_DISPLAY[selectedInvoice.paymentMethod]?.icon}{' '}
                                {PAYMENT_DISPLAY[selectedInvoice.paymentMethod]?.label || selectedInvoice.paymentMethod}
                            </span>
                            {selectedInvoice.store && (
                                <span className="badge badge-blue">
                                    {selectedInvoice.store.name}
                                </span>
                            )}
                        </div>

                        {/* Items */}
                        <div>
                            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                                Items ({selectedInvoice.items?.length || 0})
                            </h3>
                            <div style={{
                                background: 'var(--glass-bg)',
                                borderRadius: 'var(--glass-radius-sm)',
                                border: '1px solid var(--glass-border)',
                                overflow: 'hidden'
                            }}>
                                {selectedInvoice.items?.map((item: any, i: number) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--space-3) var(--space-4)',
                                            borderBottom: i < selectedInvoice.items.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                                                {item.product?.name}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {item.product?.sku} · {formatCurrency(item.unitPrice)} × {item.quantity}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                                            {formatCurrency(item.total)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div
                            style={{
                                background: 'var(--glass-bg)',
                                borderRadius: 'var(--glass-radius-sm)',
                                border: '1px solid var(--glass-border)',
                                padding: 'var(--space-4)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                            </div>
                            {selectedInvoice.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--pbc-teal)' }}>
                                    <span>Discount</span>
                                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                <span>CGST ({selectedInvoice.taxRate / 2}%)</span>
                                <span>{formatCurrency(selectedInvoice.taxAmount / 2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                <span>SGST ({selectedInvoice.taxRate / 2}%)</span>
                                <span>{formatCurrency(selectedInvoice.taxAmount / 2)}</span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-3) 0 0',
                                    marginTop: 'var(--space-2)',
                                    borderTop: '1px solid var(--glass-border)',
                                    fontSize: 'var(--text-lg)',
                                    fontWeight: 800,
                                }}
                            >
                                <span>Grand Total</span>
                                <span>{formatCurrency(selectedInvoice.total)}</span>
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedInvoice.notes && (
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                📝 {selectedInvoice.notes}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            {selectedInvoice.status === 'COMPLETED' && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setActionType('refund')}
                                        style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
                                    >
                                        <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refund
                                    </Button>
                                </>
                            )}
                            {(selectedInvoice.status === 'COMPLETED' || selectedInvoice.status === 'HELD') && (
                                <Button
                                    variant="outline"
                                    onClick={() => setActionType('void')}
                                    style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}
                                >
                                    <XCircle size={16} style={{ marginRight: '6px' }} /> Void
                                </Button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button
                                variant="outline"
                                onClick={() => handleCopyLink(selectedInvoice.shareToken, selectedInvoice.id)}
                            >
                                {linkCopied === selectedInvoice.id ? (
                                    <>
                                        <CheckCircle size={16} style={{ marginRight: '6px', color: 'var(--pbc-teal)' }} />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} style={{ marginRight: '6px' }} />
                                        Copy Link
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    window.open(`/invoice/${selectedInvoice.shareToken}`, '_blank')
                                }}
                            >
                                <ExternalLink size={16} style={{ marginRight: '6px' }} />
                                Open
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modal (Refund / Void) */}
            <Modal
                isOpen={!!actionType}
                onClose={() => {
                    if (!isProcessing) {
                        setActionType(null)
                        setActionReason('')
                    }
                }}
                title={actionType === 'refund' ? 'Process Refund' : 'Void Invoice'}
                maxWidth="400px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{
                        padding: 'var(--space-3)',
                        borderRadius: '8px',
                        background: actionType === 'refund' ? 'rgba(255,193,7,0.1)' : 'rgba(255,107,107,0.1)',
                        fontSize: 'var(--text-sm)'
                    }}>
                        {actionType === 'refund' ? (
                            <><strong>Warning:</strong> Refunding will restore {selectedInvoice?.items?.length || 0} items to inventory and deduct loyalty points from the customer.</>
                        ) : (
                            <><strong>Warning:</strong> Voiding will cancel the invoice <u>without</u> restoring inventory. This is usually for data entry errors.</>
                        )}
                    </div>

                    <Input
                        label="Reason for action (Required)"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="e.g. Customer returned items, Cashier error..."
                        autoFocus
                    />

                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                        <Button
                            variant="ghost"
                            onClick={() => { setActionType(null); setActionReason('') }}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInvoiceAction}
                            isLoading={isProcessing}
                            style={actionType === 'refund' ? { background: 'var(--warning)', color: '#000' } : { background: 'var(--coral)' }}
                        >
                            {actionType === 'refund' ? 'Confirm Refund' : 'Confirm Void'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
