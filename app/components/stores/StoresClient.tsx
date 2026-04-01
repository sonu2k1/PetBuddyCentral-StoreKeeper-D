'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createStore, updateStore, toggleStoreActive } from '@/app/actions/store'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, MapPin, Phone, Hash, Building2, Power } from 'lucide-react'

interface StoresClientProps {
    stores: any[]
}

export function StoresClient({ stores: initialStores }: StoresClientProps) {
    const [stores, setStores] = useState(initialStores)
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingStore, setEditingStore] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [form, setForm] = useState({
        name: '', code: '', address: '', city: '', state: '', pincode: '', phone: '', gstNumber: '',
    })

    const resetForm = () => setForm({ name: '', code: '', address: '', city: '', state: '', pincode: '', phone: '', gstNumber: '' })

    const filteredStores = stores.filter((s: any) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase())
    )

    const handleAdd = async () => {
        setIsSubmitting(true)
        try {
            await createStore(form)
            setShowAddModal(false)
            resetForm()
            window.location.reload()
        } catch (e: any) {
            alert(e.message || 'Failed to create store')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!editingStore) return
        setIsSubmitting(true)
        try {
            await updateStore(editingStore.id, {
                name: form.name,
                address: form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                phone: form.phone,
                gstNumber: form.gstNumber || undefined,
            })
            setEditingStore(null)
            resetForm()
            window.location.reload()
        } catch (e: any) {
            alert(e.message || 'Failed to update store')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = async (storeId: string) => {
        try {
            await toggleStoreActive(storeId)
            window.location.reload()
        } catch (e: any) {
            alert(e.message)
        }
    }

    const openEdit = (store: any) => {
        setForm({
            name: store.name,
            code: store.code,
            address: store.address,
            city: store.city,
            state: store.state,
            pincode: store.pincode,
            phone: store.phone,
            gstNumber: store.gstNumber || '',
        })
        setEditingStore(store)
    }

    // Stats
    const activeStores = stores.filter((s: any) => s.isActive).length
    const totalUsers = stores.reduce((sum: number, s: any) => sum + (s._count?.users || 0), 0)
    const totalInvoices = stores.reduce((sum: number, s: any) => sum + (s._count?.invoices || 0), 0)

    return (
        <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Stores</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{activeStores}</div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Staff</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{totalUsers}</div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Invoices</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{totalInvoices}</div>
                    </div>
                </GlassCard>
            </div>

            {/* Header actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                <div style={{ flex: 1, maxWidth: '320px' }}>
                    <Input
                        placeholder="Search stores..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <Button onClick={() => { resetForm(); setShowAddModal(true) }}>
                    <Plus size={16} style={{ marginRight: '6px' }} /> Add Store
                </Button>
            </div>

            {/* Store grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
                {filteredStores.map((store: any) => (
                    <GlassCard key={store.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{store.name}</div>
                                <code style={{ fontSize: 'var(--text-xs)', color: 'var(--pbc-teal)' }}>{store.code}</code>
                            </div>
                            <span className={`badge ${store.isActive ? 'badge-success' : 'badge-danger'}`}>
                                {store.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} /> {store.address}, {store.city} — {store.pincode}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={14} /> {store.phone}
                            </div>
                            {store.gstNumber && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Hash size={14} /> <code style={{ fontSize: '11px' }}>{store.gstNumber}</code>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                            <div style={{ padding: '8px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Staff</div>
                                <div style={{ fontWeight: 700 }}>{store._count?.users || 0}</div>
                            </div>
                            <div style={{ padding: '8px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Invoices</div>
                                <div style={{ fontWeight: 700 }}>{store._count?.invoices || 0}</div>
                            </div>
                            <div style={{ padding: '8px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Products</div>
                                <div style={{ fontWeight: 700 }}>{store._count?.inventory || 0}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button variant="outline" size="sm" onClick={() => openEdit(store)} style={{ flex: 1 }}>
                                Edit
                            </Button>
                            <Button
                                variant={store.isActive ? 'ghost' : 'primary'}
                                size="sm"
                                onClick={() => handleToggle(store.id)}
                                style={{ flex: 1 }}
                            >
                                <Power size={14} style={{ marginRight: '4px' }} />
                                {store.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Add Store Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Store" maxWidth="550px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="Store Name" placeholder="e.g. Kanpur Hub Store" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input label="Store Code" placeholder="e.g. S03" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                    </div>
                    <Input label="Address" placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                        <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                        <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        <Input label="GST Number (optional)" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={handleAdd} isLoading={isSubmitting} disabled={!form.name || !form.code || !form.city}>
                            Create Store
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Store Modal */}
            <Modal isOpen={!!editingStore} onClose={() => { setEditingStore(null); resetForm() }} title={`Edit ${editingStore?.name || 'Store'}`} maxWidth="550px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Input label="Store Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                        <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                        <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        <Input label="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => { setEditingStore(null); resetForm() }}>Cancel</Button>
                        <Button onClick={handleEdit} isLoading={isSubmitting}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
