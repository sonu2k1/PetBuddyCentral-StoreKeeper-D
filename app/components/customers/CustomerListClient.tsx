'use client'

import { useState } from 'react'
import { createCustomer, updateCustomer } from '@/app/actions/customer'
import { addPet, deletePet } from '@/app/actions/pet'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Phone, Mail, MapPin, ChevronRight, PawPrint, X } from 'lucide-react'

const TIER_DISPLAY: Record<string, { emoji: string; color: string }> = {
    GOLD: { emoji: '🥇', color: 'var(--warning)' },
    SILVER: { emoji: '🥈', color: '#C0C0C0' },
    BRONZE: { emoji: '🥉', color: '#CD7F32' },
}

const PET_ICONS: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    bird: '🐦',
    fish: '🐠',
    rabbit: '🐰',
    hamster: '🐹',
}

interface CustomerListProps {
    initialData: any
    showAddButton?: boolean
}

export function CustomerListClient({ initialData, showAddButton = true }: CustomerListProps) {
    const [search, setSearch] = useState('')
    const [data, setData] = useState(initialData)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showAddPetModal, setShowAddPetModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // New customer form
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    })

    // New pet form
    const [newPet, setNewPet] = useState({
        name: '',
        type: 'dog',
        breed: '',
    })

    const filteredCustomers = data.customers.filter(
        (c: any) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
    )

    const handleAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone) return
        setIsSubmitting(true)
        try {
            const customer = await createCustomer(newCustomer)
            setData((prev: any) => ({
                ...prev,
                customers: [{ ...customer, pets: [], _count: { invoices: 0 } }, ...prev.customers],
                total: prev.total + 1,
            }))
            setShowAddModal(false)
            setNewCustomer({ name: '', phone: '', email: '', address: '' })
        } catch (error: any) {
            alert(error.message || 'Failed to add customer')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddPet = async () => {
        if (!selectedCustomer || !newPet.name) return
        setIsSubmitting(true)
        try {
            const pet = await addPet({
                customerId: selectedCustomer.id,
                name: newPet.name,
                type: newPet.type,
                breed: newPet.breed || undefined,
            })
            // Update local state
            setSelectedCustomer((prev: any) => ({
                ...prev,
                pets: [...(prev.pets || []), pet],
            }))
            setData((prev: any) => ({
                ...prev,
                customers: prev.customers.map((c: any) =>
                    c.id === selectedCustomer.id
                        ? { ...c, pets: [...(c.pets || []), pet] }
                        : c
                ),
            }))
            setShowAddPetModal(false)
            setNewPet({ name: '', type: 'dog', breed: '' })
        } catch (error: any) {
            alert(error.message || 'Failed to add pet')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeletePet = async (petId: string) => {
        if (!confirm('Remove this pet?')) return
        try {
            await deletePet(petId)
            setSelectedCustomer((prev: any) => ({
                ...prev,
                pets: prev.pets.filter((p: any) => p.id !== petId),
            }))
            setData((prev: any) => ({
                ...prev,
                customers: prev.customers.map((c: any) =>
                    c.id === selectedCustomer.id
                        ? { ...c, pets: c.pets.filter((p: any) => p.id !== petId) }
                        : c
                ),
            }))
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Search & Add */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Input
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={18} />}
                    style={{ width: '300px', marginBottom: 0 }}
                />
                {showAddButton && (
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Customer
                    </Button>
                )}
            </div>

            {/* Customer Table */}
            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Loyalty</th>
                                <th>Pets</th>
                                <th>Invoices</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                        {search ? `No customers matching "${search}"` : 'No customers yet'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer: any) => {
                                    const tier = TIER_DISPLAY[customer.loyaltyTier] || TIER_DISPLAY.BRONZE
                                    return (
                                        <tr
                                            key={customer.id}
                                            onClick={() => setSelectedCustomer(customer)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                                {customer.email && (
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                        {customer.email}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <code style={{ fontSize: 'var(--text-xs)' }}>{customer.phone}</code>
                                            </td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: `${tier.color}20`,
                                                        color: tier.color,
                                                        border: `1px solid ${tier.color}40`,
                                                    }}
                                                >
                                                    {tier.emoji} {customer.loyaltyTier} · {customer.loyaltyPoints} pts
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {customer.pets?.map((pet: any) => (
                                                        <span key={pet.id} title={`${pet.name} (${pet.breed || pet.type})`}>
                                                            {PET_ICONS[pet.type] || '🐾'}
                                                        </span>
                                                    ))}
                                                    {(!customer.pets || customer.pets.length === 0) && (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{customer._count?.invoices || 0}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                {formatDate(customer.createdAt)}
                                            </td>
                                            <td>
                                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Customer Detail Modal */}
            <Modal
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                title={selectedCustomer?.name || 'Customer'}
                maxWidth="600px"
            >
                {selectedCustomer && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                        {/* Contact Info */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 'var(--space-3)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                                <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                                {selectedCustomer.phone}
                            </div>
                            {selectedCustomer.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                                    {selectedCustomer.email}
                                </div>
                            )}
                            {selectedCustomer.address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', gridColumn: 'span 2' }}>
                                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                                    {selectedCustomer.address}
                                </div>
                            )}
                        </div>

                        {/* Loyalty Badge */}
                        <div
                            style={{
                                padding: 'var(--space-3) var(--space-4)',
                                background: 'var(--glass-bg)',
                                borderRadius: 'var(--glass-radius-sm)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '2px' }}>Loyalty Tier</div>
                                <div style={{ fontWeight: 700 }}>
                                    {TIER_DISPLAY[selectedCustomer.loyaltyTier]?.emoji}{' '}
                                    {selectedCustomer.loyaltyTier}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '2px' }}>Points</div>
                                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--pbc-teal)' }}>
                                    {selectedCustomer.loyaltyPoints}
                                </div>
                            </div>
                        </div>

                        {/* Pets Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                                    <PawPrint size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                    Pets
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddPetModal(true)}
                                >
                                    <Plus size={14} /> Add Pet
                                </Button>
                            </div>

                            {selectedCustomer.pets?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {selectedCustomer.pets.map((pet: any) => (
                                        <div
                                            key={pet.id}
                                            style={{
                                                padding: 'var(--space-3)',
                                                background: 'var(--glass-bg)',
                                                borderRadius: 'var(--glass-radius-sm)',
                                                border: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <span style={{ fontSize: '24px' }}>
                                                    {PET_ICONS[pet.type] || '🐾'}
                                                </span>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                                        {pet.name}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                        {pet.breed || pet.type}
                                                        {pet.weight ? ` · ${pet.weight}kg` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeletePet(pet.id)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--coral)', padding: '4px' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>
                                    No pets registered yet
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Customer Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Customer"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <Input
                        label="Full Name"
                        required
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Enter customer name"
                    />
                    <Input
                        label="Phone Number"
                        required
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 9876543210"
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                        placeholder="customer@email.com"
                    />
                    <Input
                        label="Address"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, address: e.target.value }))}
                        placeholder="Full address"
                    />
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddCustomer} isLoading={isSubmitting}>
                            Add Customer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Pet Modal */}
            <Modal
                isOpen={showAddPetModal}
                onClose={() => setShowAddPetModal(false)}
                title="Add Pet"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <Input
                        label="Pet Name"
                        required
                        value={newPet.name}
                        onChange={(e) => setNewPet((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Bruno"
                    />
                    <div className="input-group">
                        <label className="input-label">Type <span style={{ color: 'var(--coral)' }}> *</span></label>
                        <select
                            className="input"
                            value={newPet.type}
                            onChange={(e) => setNewPet((p) => ({ ...p, type: e.target.value }))}
                        >
                            <option value="dog">🐕 Dog</option>
                            <option value="cat">🐱 Cat</option>
                            <option value="bird">🐦 Bird</option>
                            <option value="fish">🐠 Fish</option>
                            <option value="rabbit">🐰 Rabbit</option>
                            <option value="hamster">🐹 Hamster</option>
                        </select>
                    </div>
                    <Input
                        label="Breed"
                        value={newPet.breed}
                        onChange={(e) => setNewPet((p) => ({ ...p, breed: e.target.value }))}
                        placeholder="e.g., Golden Retriever"
                    />
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => setShowAddPetModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddPet} isLoading={isSubmitting}>
                            Add Pet
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
