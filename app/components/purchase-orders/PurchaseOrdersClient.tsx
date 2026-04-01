'use client'

import { useState, useMemo } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createPurchaseOrder, updatePOStatus, receivePOItems } from '@/app/actions/purchaseOrder'
import { createSupplier } from '@/app/actions/supplier'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    Search, Plus, Truck, Package, Clock, CheckCircle, XCircle,
    ChevronRight, Trash2
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
    DRAFT: { color: 'badge-neutral', icon: Clock, label: 'Draft' },
    SENT: { color: 'badge-blue', icon: Truck, label: 'Sent' },
    PARTIAL: { color: 'badge-warning', icon: Package, label: 'Partial' },
    RECEIVED: { color: 'badge-success', icon: CheckCircle, label: 'Received' },
    CANCELLED: { color: 'badge-danger', icon: XCircle, label: 'Cancelled' },
}

interface PurchaseOrdersClientProps {
    purchaseOrders: any[]
    suppliers: any[]
    stores: any[]
    products: any[]
}

export function PurchaseOrdersClient({ purchaseOrders, suppliers, stores, products }: PurchaseOrdersClientProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showSupplierModal, setShowSupplierModal] = useState(false)
    const [selectedPO, setSelectedPO] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Create PO form
    const [poForm, setPOForm] = useState({
        storeId: stores[0]?.id || '',
        supplierId: '',
        expectedDate: '',
        notes: '',
    })
    const [poItems, setPOItems] = useState<Array<{ productId: string; quantityOrdered: number; unitCost: number }>>([])

    // Create supplier form
    const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '' })

    // Receive form
    const [receiveItems, setReceiveItems] = useState<Record<string, number>>({})

    const filteredPOs = useMemo(() => {
        return purchaseOrders.filter((po: any) => {
            const matchSearch = !search ||
                po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
                po.supplier?.name.toLowerCase().includes(search.toLowerCase())
            const matchStatus = !statusFilter || po.status === statusFilter
            return matchSearch && matchStatus
        })
    }, [purchaseOrders, search, statusFilter])

    // Stats
    const stats = {
        total: purchaseOrders.length,
        draft: purchaseOrders.filter((p: any) => p.status === 'DRAFT').length,
        pending: purchaseOrders.filter((p: any) => ['SENT', 'PARTIAL'].includes(p.status)).length,
        completed: purchaseOrders.filter((p: any) => p.status === 'RECEIVED').length,
    }

    const addPOItem = () => {
        setPOItems([...poItems, { productId: '', quantityOrdered: 1, unitCost: 0 }])
    }

    const removePOItem = (index: number) => {
        setPOItems(poItems.filter((_, i) => i !== index))
    }

    const updatePOItem = (index: number, field: string, value: any) => {
        setPOItems(poItems.map((item, i) => {
            if (i !== index) return item
            const updated = { ...item, [field]: value }
            // Auto-fill cost price when product is selected
            if (field === 'productId') {
                const product = products.find((p: any) => p.id === value)
                if (product) updated.unitCost = product.costPrice || product.price
            }
            return updated
        }))
    }

    const handleCreatePO = async () => {
        const validItems = poItems.filter((i) => i.productId && i.quantityOrdered > 0)
        if (validItems.length === 0) { alert('Add at least one item'); return }
        setIsSubmitting(true)
        try {
            await createPurchaseOrder({
                storeId: poForm.storeId,
                supplierId: poForm.supplierId,
                expectedDate: poForm.expectedDate || undefined,
                notes: poForm.notes || undefined,
                items: validItems,
            })
            setShowCreateModal(false)
            setPOItems([])
            window.location.reload()
        } catch (e: any) {
            alert(e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateSupplier = async () => {
        setIsSubmitting(true)
        try {
            await createSupplier(supplierForm)
            setShowSupplierModal(false)
            setSupplierForm({ name: '', phone: '', email: '', address: '' })
            window.location.reload()
        } catch (e: any) {
            alert(e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStatusChange = async (poId: string, newStatus: string) => {
        try {
            await updatePOStatus(poId, newStatus)
            window.location.reload()
        } catch (e: any) {
            alert(e.message)
        }
    }

    const handleReceive = async () => {
        if (!selectedPO) return
        const items = Object.entries(receiveItems)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, quantityReceived]) => ({ itemId, quantityReceived }))
        if (items.length === 0) { alert('Enter quantities to receive'); return }

        setIsSubmitting(true)
        try {
            await receivePOItems(selectedPO.id, items)
            setSelectedPO(null)
            setReceiveItems({})
            window.location.reload()
        } catch (e: any) {
            alert(e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const poTotal = poItems.reduce((sum, i) => sum + i.unitCost * i.quantityOrdered, 0)

    return (
        <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {[
                    { label: 'Total POs', value: stats.total, color: '' },
                    { label: 'Drafts', value: stats.draft, color: 'var(--text-muted)' },
                    { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
                    { label: 'Completed', value: stats.completed, color: 'var(--pbc-teal)' },
                ].map((s) => (
                    <GlassCard key={s.label}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: s.color || 'inherit' }}>{s.value}</div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, maxWidth: '300px' }}>
                    <Input placeholder="Search PO# or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={18} />} style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {['', 'DRAFT', 'SENT', 'PARTIAL', 'RECEIVED'].map((s) => (
                        <button key={s} className={`pos-category-tab ${statusFilter === s ? 'pos-category-tab--active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {s ? STATUS_CONFIG[s]?.label : 'All'}
                        </button>
                    ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="outline" onClick={() => setShowSupplierModal(true)}>
                        <Plus size={14} style={{ marginRight: '4px' }} /> Supplier
                    </Button>
                    <Button onClick={() => { setPOItems([{ productId: '', quantityOrdered: 1, unitCost: 0 }]); setShowCreateModal(true) }}>
                        <Plus size={16} style={{ marginRight: '6px' }} /> New PO
                    </Button>
                </div>
            </div>

            {/* PO Table */}
            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>PO Number</th>
                                <th>Supplier</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Expected</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPOs.map((po: any) => {
                                const sc = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT
                                return (
                                    <tr key={po.id} onClick={() => { setSelectedPO(po); setReceiveItems({}) }} style={{ cursor: 'pointer' }}>
                                        <td><code style={{ fontWeight: 700, color: 'var(--pbc-teal)' }}>{po.poNumber}</code></td>
                                        <td style={{ fontWeight: 500 }}>{po.supplier?.name}</td>
                                        <td><span className="badge badge-neutral">{po.items?.length || 0} items</span></td>
                                        <td style={{ fontWeight: 700 }}>{formatCurrency(po.totalAmount || 0)}</td>
                                        <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                            {po.expectedDate ? formatDate(po.expectedDate) : '—'}
                                        </td>
                                        <td><span className={`badge ${sc.color}`}>{sc.label}</span></td>
                                        <td>
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedPO(po); setReceiveItems({}) }}>
                                                <ChevronRight size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredPOs.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No purchase orders</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Create PO Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Purchase Order" maxWidth="700px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <div className="input-group">
                            <label className="input-label">Store</label>
                            <select className="input" value={poForm.storeId} onChange={(e) => setPOForm({ ...poForm, storeId: e.target.value })}>
                                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Supplier</label>
                            <select className="input" value={poForm.supplierId} onChange={(e) => setPOForm({ ...poForm, supplierId: e.target.value })}>
                                <option value="">Select supplier</option>
                                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <div className="input-group">
                            <label className="input-label">Expected Date</label>
                            <input type="date" className="input" value={poForm.expectedDate} onChange={(e) => setPOForm({ ...poForm, expectedDate: e.target.value })} />
                        </div>
                        <Input label="Notes" value={poForm.notes} onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })} />
                    </div>

                    {/* Line Items */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Items</h3>
                            <Button variant="ghost" size="sm" onClick={addPOItem}><Plus size={14} style={{ marginRight: '4px' }} /> Add Item</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {poItems.map((item, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'end' }}>
                                    <div className="input-group">
                                        {index === 0 && <label className="input-label">Product</label>}
                                        <select className="input" value={item.productId} onChange={(e) => updatePOItem(index, 'productId', e.target.value)}>
                                            <option value="">Select product</option>
                                            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        {index === 0 && <label className="input-label">Qty</label>}
                                        <input type="number" className="input" min={1} value={item.quantityOrdered} onChange={(e) => updatePOItem(index, 'quantityOrdered', parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div className="input-group">
                                        {index === 0 && <label className="input-label">Unit Cost</label>}
                                        <input type="number" className="input" min={0} step={0.01} value={item.unitCost} onChange={(e) => updatePOItem(index, 'unitCost', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removePOItem(index)} style={{ marginBottom: '2px' }}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'right', marginTop: 'var(--space-3)', fontWeight: 700 }}>
                            Total: {formatCurrency(poTotal)}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button onClick={handleCreatePO} isLoading={isSubmitting} disabled={!poForm.supplierId || poItems.length === 0}>
                            Create Purchase Order
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Supplier Modal */}
            <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title="Add Supplier" maxWidth="450px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Input label="Company Name" placeholder="e.g. Royal Canin India" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                        <Input label="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                    </div>
                    <Input label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                        <Button variant="ghost" onClick={() => setShowSupplierModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateSupplier} isLoading={isSubmitting} disabled={!supplierForm.name}>Add Supplier</Button>
                    </div>
                </div>
            </Modal>

            {/* PO Detail / Receive Modal */}
            <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title={`${selectedPO?.poNumber || ''} — Details`} maxWidth="650px">
                {selectedPO && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Supplier</div>
                                <div style={{ fontWeight: 600 }}>{selectedPO.supplier?.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Status</div>
                                <span className={`badge ${STATUS_CONFIG[selectedPO.status]?.color}`}>
                                    {STATUS_CONFIG[selectedPO.status]?.label}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total</div>
                                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{formatCurrency(selectedPO.totalAmount || 0)}</div>
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--glass-radius-sm)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                            <table className="table" style={{ marginBottom: 0 }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Ordered</th>
                                        <th>Received</th>
                                        <th>Unit Cost</th>
                                        {['SENT', 'PARTIAL'].includes(selectedPO.status) && <th>Receive</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPO.items?.map((item: any) => {
                                        const remaining = item.quantityOrdered - item.quantityReceived
                                        return (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 500 }}>{item.productId}</td>
                                                <td>{item.quantityOrdered}</td>
                                                <td>
                                                    <span style={{ color: item.quantityReceived >= item.quantityOrdered ? 'var(--pbc-teal)' : 'var(--warning)' }}>
                                                        {item.quantityReceived}
                                                    </span>
                                                </td>
                                                <td>{formatCurrency(item.unitCost)}</td>
                                                {['SENT', 'PARTIAL'].includes(selectedPO.status) && (
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input"
                                                            style={{ width: '80px', padding: '4px 8px' }}
                                                            min={0}
                                                            max={remaining}
                                                            value={receiveItems[item.id] || ''}
                                                            onChange={(e) => setReceiveItems({ ...receiveItems, [item.id]: parseInt(e.target.value) || 0 })}
                                                            placeholder={`max ${remaining}`}
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                            {selectedPO.status === 'DRAFT' && (
                                <>
                                    <Button variant="outline" onClick={() => handleStatusChange(selectedPO.id, 'SENT')}>
                                        <Truck size={16} style={{ marginRight: '6px' }} /> Mark as Sent
                                    </Button>
                                    <Button variant="ghost" onClick={() => handleStatusChange(selectedPO.id, 'CANCELLED')}>
                                        Cancel PO
                                    </Button>
                                </>
                            )}
                            {['SENT', 'PARTIAL'].includes(selectedPO.status) && (
                                <Button onClick={handleReceive} isLoading={isSubmitting}>
                                    <Package size={16} style={{ marginRight: '6px' }} /> Receive Items
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}
