'use client'

import { useState, useMemo } from 'react'
import { createInvoice, getHeldInvoices, deleteHeldInvoice } from '@/app/actions/invoice'
import { searchCustomers } from '@/app/actions/customer'
import { addPet } from '@/app/actions/pet'
import { formatCurrency, calculateGST } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
    Search, ShoppingCart, Plus, Minus, Trash2, User, CreditCard,
    Banknote, Smartphone, CheckCircle, Copy, X, PauseCircle, Clock
} from 'lucide-react'

interface CartItem {
    productId: string
    name: string
    sku: string
    unitPrice: number
    quantity: number
    maxStock: number
    unit: string
}

interface POSClientProps {
    storeId: string
    products: any[]
    categories: any[]
}

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash', icon: Banknote, color: 'var(--pbc-teal)' },
    { value: 'UPI', label: 'UPI', icon: Smartphone, color: '#6C5CE7' },
    { value: 'CARD', label: 'Card', icon: CreditCard, color: 'var(--pbc-blue)' },
]

export function POSClient({ storeId, products, categories }: POSClientProps) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [cart, setCart] = useState<CartItem[]>([])
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isHolding, setIsHolding] = useState(false)

    // Held Invoice states
    const [heldInvoices, setHeldInvoices] = useState<any[]>([])
    const [showHeldModal, setShowHeldModal] = useState(false)
    const [isLoadingHeld, setIsLoadingHeld] = useState(false)

    // Customer picker state
    const [customerSearch, setCustomerSearch] = useState('')
    const [customerResults, setCustomerResults] = useState<any[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)

    // Add Pet state
    const [showPetModal, setShowPetModal] = useState(false)
    const [isSubmittingPet, setIsSubmittingPet] = useState(false)
    const [newPet, setNewPet] = useState({ name: '', type: 'Dog', breed: '', weight: '', dietaryNeeds: '', medicalConditions: '' })

    // Success modal
    const [completedInvoice, setCompletedInvoice] = useState<any>(null)

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((p: any) => {
            const matchSearch =
                !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase())
            const matchCategory = !activeCategory || p.categoryId === activeCategory
            return matchSearch && matchCategory
        })
    }, [products, search, activeCategory])

    // Cart calculations
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const gst = calculateGST(Math.max(0, subtotal - discount))
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Add to cart
    const addToCart = (product: any) => {
        const stock = product.inventory?.[0]?.quantity ?? 0
        setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id)
            if (existing) {
                if (existing.quantity >= stock) return prev
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    sku: product.sku,
                    unitPrice: product.price,
                    quantity: 1,
                    maxStock: stock,
                    unit: product.unit,
                },
            ]
        })
    }

    // Update quantity
    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.productId !== productId) return item
                    const newQty = item.quantity + delta
                    if (newQty <= 0) return null as any
                    if (newQty > item.maxStock) return item
                    return { ...item, quantity: newQty }
                })
                .filter(Boolean)
        )
    }

    // Remove from cart
    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId))
    }

    // Customer search
    const handleCustomerSearch = async (query: string) => {
        setCustomerSearch(query)
        if (query.length < 2) {
            setCustomerResults([])
            return
        }
        setIsSearchingCustomer(true)
        try {
            const results = await searchCustomers(query)
            setCustomerResults(results)
        } catch {
            setCustomerResults([])
        } finally {
            setIsSearchingCustomer(false)
        }
    }

    // Complete sale
    const handleCompleteSale = async (status: 'COMPLETED' | 'HELD' = 'COMPLETED') => {
        if (cart.length === 0) return
        status === 'HELD' ? setIsHolding(true) : setIsSubmitting(true)
        try {
            const invoice = await createInvoice({
                storeId,
                customerId: selectedCustomer?.id,
                items: cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                discount,
                paymentMethod,
                notes: notes || undefined,
                status,
            })

            if (status === 'HELD') {
                alert('Order put on hold.')
            } else {
                setCompletedInvoice(invoice)
            }

            // Reset cart
            setCart([])
            setDiscount(0)
            setNotes('')
            setSelectedCustomer(null)
            setCustomerSearch('')
        } catch (error: any) {
            alert(error.message || 'Failed to complete transaction')
        } finally {
            status === 'HELD' ? setIsHolding(false) : setIsSubmitting(false)
        }
    }

    // Load Held Invoices
    const handleOpenHeldModal = async () => {
        setShowHeldModal(true)
        setIsLoadingHeld(true)
        try {
            const invoices = await getHeldInvoices(storeId)
            setHeldInvoices(invoices)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsLoadingHeld(false)
        }
    }

    // Resume Held Invoice
    const handleResumeInvoice = async (invoice: any) => {
        if (cart.length > 0) {
            if (!confirm('You have items in your current cart. Resuming an order will replace them. Continue?')) {
                return
            }
        }

        try {
            // Delete the held draft
            await deleteHeldInvoice(invoice.id)

            // Populate cart
            setCart(invoice.items.map((item: any) => ({
                productId: item.productId,
                name: item.product.name,
                sku: item.product.sku,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                maxStock: item.product.inventory?.[0]?.quantity ?? 0,
                unit: item.product.unit,
            })))
            setDiscount(invoice.discount)
            setNotes(invoice.notes || '')
            setSelectedCustomer(invoice.customer || null)
            setPaymentMethod(invoice.paymentMethod)

            setShowHeldModal(false)
            setHeldInvoices((prev) => prev.filter(i => i.id !== invoice.id))
        } catch (err: any) {
            alert(err.message || 'Failed to resume order')
        }
    }

    // Delete Held Invoice (Cancel)
    const handleCancelHeldInvoice = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this held order?')) return
        try {
            await deleteHeldInvoice(id)
            setHeldInvoices((prev) => prev.filter(i => i.id !== id))
        } catch (err: any) {
            alert(err.message || 'Failed to cancel held order')
        }
    }

    // Add Pet from POS
    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer) return
        setIsSubmittingPet(true)
        try {
            const pet = await addPet({
                customerId: selectedCustomer.id,
                name: newPet.name,
                type: newPet.type,
                breed: newPet.breed || undefined,
                weight: newPet.weight ? parseFloat(newPet.weight) : undefined,
                dietaryNeeds: newPet.dietaryNeeds ? newPet.dietaryNeeds.split(',').map(s => s.trim()) : [],
                medicalConditions: newPet.medicalConditions ? newPet.medicalConditions.split(',').map(s => s.trim()) : [],
            })
            // Update selected customer with new pet
            setSelectedCustomer({
                ...selectedCustomer,
                pets: [...(selectedCustomer.pets || []), pet]
            })
            setShowPetModal(false)
            setNewPet({ name: '', type: 'Dog', breed: '', weight: '', dietaryNeeds: '', medicalConditions: '' })
        } catch (err: any) {
            alert(err.message || 'Failed to add pet')
        } finally {
            setIsSubmittingPet(false)
        }
    }

    // Copy share link
    const copyShareLink = () => {
        if (!completedInvoice) return
        const url = `${window.location.origin}/invoice/${completedInvoice.shareToken}`
        navigator.clipboard.writeText(url)
        alert('Invoice link copied!')
    }

    return (
        <div className="pos-layout">
            {/* LEFT: Product Grid */}
            <div className="pos-products">
                {/* Search Bar */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                        placeholder="Search products by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ marginBottom: 0 }}
                    />
                </div>

                {/* Category Tabs */}
                <div className="pos-category-tabs">
                    <button
                        className={`pos-category-tab ${!activeCategory ? 'pos-category-tab--active' : ''}`}
                        onClick={() => setActiveCategory(null)}
                    >
                        🏷️ All
                    </button>
                    {categories.map((cat: any) => (
                        <button
                            key={cat.id}
                            className={`pos-category-tab ${activeCategory === cat.id ? 'pos-category-tab--active' : ''}`}
                            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="pos-product-grid">
                    {filteredProducts.map((product: any) => {
                        const stock = product.inventory?.[0]?.quantity ?? 0
                        const isLowStock = stock <= (product.inventory?.[0]?.lowStockThreshold ?? 10)
                        const cartItem = cart.find((item) => item.productId === product.id)
                        const isOutOfStock = stock <= 0

                        return (
                            <button
                                key={product.id}
                                className={`pos-product-card ${cartItem ? 'pos-product-card--in-cart' : ''} ${isOutOfStock ? 'pos-product-card--oos' : ''}`}
                                onClick={() => !isOutOfStock && addToCart(product)}
                                disabled={isOutOfStock}
                            >
                                <div className="pos-product-card-header">
                                    <span className="pos-product-category">
                                        {product.category?.icon} {product.category?.name}
                                    </span>
                                    {cartItem && (
                                        <span className="pos-product-qty-badge">
                                            {cartItem.quantity}
                                        </span>
                                    )}
                                </div>
                                <div className="pos-product-name">{product.name}</div>
                                <div className="pos-product-sku">{product.sku}</div>
                                <div className="pos-product-footer">
                                    <span className="pos-product-price">{formatCurrency(product.price)}</span>
                                    <span
                                        className={`pos-product-stock ${isLowStock ? 'pos-product-stock--low' : ''} ${isOutOfStock ? 'pos-product-stock--oos' : ''}`}
                                    >
                                        {isOutOfStock ? 'Out of Stock' : `${stock} ${product.unit}`}
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                    {filteredProducts.length === 0 && (
                        <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                            No products found
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart */}
            <div className="pos-cart">
                <div className="pos-cart-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <ShoppingCart size={20} /> Cart
                        </h2>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button variant="ghost" size="sm" onClick={handleOpenHeldModal}>
                                <Clock size={16} style={{ marginRight: '6px' }} /> Held Orders
                            </Button>
                            {totalItems > 0 && (
                                <span className="badge badge-teal">{totalItems} items</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer Picker */}
                <div className="pos-cart-section">
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        Customer (optional)
                    </label>
                    {selectedCustomer ? (
                        <div className="pos-selected-customer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                        {selectedCustomer.name}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        {selectedCustomer.phone} · {selectedCustomer.loyaltyTier}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}
                                    style={{ padding: '4px' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Pets Display */}
                            <div style={{ padding: 'var(--space-2)', background: 'var(--glass-bg)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Pets</span>
                                    <button
                                        onClick={() => setShowPetModal(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--pbc-teal)', fontSize: 'var(--text-xs)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Plus size={12} style={{ marginRight: '2px' }} /> Add Pet
                                    </button>
                                </div>
                                {selectedCustomer.pets && selectedCustomer.pets.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {selectedCustomer.pets.map((pet: any) => (
                                            <span key={pet.id} className="badge badge-teal" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                {pet.name} ({pet.type})
                                                {pet.dietaryNeeds?.length > 4 && ' ⚠️'}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No pets registered.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <Input
                                placeholder="Search by name or phone..."
                                value={customerSearch}
                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                icon={<User size={16} />}
                                style={{ marginBottom: 0 }}
                            />
                            {customerResults.length > 0 && (
                                <div className="pos-customer-dropdown">
                                    {customerResults.map((c: any) => (
                                        <button
                                            key={c.id}
                                            className="pos-customer-option"
                                            onClick={() => {
                                                setSelectedCustomer(c)
                                                setCustomerResults([])
                                                setCustomerSearch('')
                                            }}
                                        >
                                            <span style={{ fontWeight: 500 }}>{c.name}</span>
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {c.phone}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="pos-cart-items">
                    {cart.length === 0 ? (
                        <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            Tap products to add them to cart
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.productId} className="pos-cart-item">
                                <div className="pos-cart-item-info">
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.name}</div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        {formatCurrency(item.unitPrice)} / {item.unit}
                                    </div>
                                </div>
                                <div className="pos-cart-item-controls">
                                    <button
                                        className="pos-qty-btn"
                                        onClick={() => updateQuantity(item.productId, -1)}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="pos-qty-value">{item.quantity}</span>
                                    <button
                                        className="pos-qty-btn"
                                        onClick={() => updateQuantity(item.productId, 1)}
                                        disabled={item.quantity >= item.maxStock}
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <button
                                        className="pos-remove-btn"
                                        onClick={() => removeFromCart(item.productId)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="pos-cart-item-total">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Section */}
                {cart.length > 0 && (
                    <div className="pos-checkout">
                        {/* Discount */}
                        {/* Discount & Notes */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Notes</label>
                                <input
                                    type="text"
                                    className="input"
                                    style={{ width: '100%', padding: '6px 8px', fontSize: 'var(--text-sm)' }}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes..."
                                />
                            </div>
                            <div style={{ width: '100px' }}>
                                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Discount (₹)</label>
                                <input
                                    type="number"
                                    className="input"
                                    style={{ width: '100%', textAlign: 'right', padding: '6px 8px' }}
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                    min={0}
                                    max={subtotal}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="pos-totals">
                            <div className="pos-totals-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="pos-totals-row" style={{ color: 'var(--pbc-teal)' }}>
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="pos-totals-row" style={{ fontSize: 'var(--text-xs)' }}>
                                <span>CGST (9%)</span>
                                <span>{formatCurrency(gst.cgst)}</span>
                            </div>
                            <div className="pos-totals-row" style={{ fontSize: 'var(--text-xs)' }}>
                                <span>SGST (9%)</span>
                                <span>{formatCurrency(gst.sgst)}</span>
                            </div>
                            <div className="pos-totals-row pos-totals-row--total">
                                <span>Total</span>
                                <span>{formatCurrency(gst.total)}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                                Payment Method
                            </label>
                            <div className="pos-payment-methods">
                                {PAYMENT_METHODS.map((pm) => {
                                    const Icon = pm.icon
                                    return (
                                        <button
                                            key={pm.value}
                                            className={`pos-payment-btn ${paymentMethod === pm.value ? 'pos-payment-btn--active' : ''}`}
                                            onClick={() => setPaymentMethod(pm.value)}
                                            style={paymentMethod === pm.value ? { borderColor: pm.color, color: pm.color } : {}}
                                        >
                                            <Icon size={16} />
                                            {pm.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Complete Sale */}
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <Button
                                variant="outline"
                                onClick={() => handleCompleteSale('HELD')}
                                isLoading={isHolding}
                                disabled={isSubmitting}
                                style={{ flex: 1, padding: '14px' }}
                            >
                                <PauseCircle size={20} style={{ marginRight: '8px' }} />
                                Hold
                            </Button>
                            <Button
                                onClick={() => handleCompleteSale('COMPLETED')}
                                isLoading={isSubmitting}
                                disabled={isHolding}
                                style={{ flex: 2, padding: '14px', fontSize: 'var(--text-base)', fontWeight: 700 }}
                            >
                                <CheckCircle size={20} style={{ marginRight: '8px' }} />
                                Pay {formatCurrency(gst.total)}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            <Modal
                isOpen={!!completedInvoice}
                onClose={() => setCompletedInvoice(null)}
                title="Sale Complete! 🎉"
                maxWidth="450px"
            >
                {completedInvoice && (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'var(--pbc-teal-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                fontSize: '32px',
                            }}
                        >
                            ✅
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>
                                {formatCurrency(completedInvoice.total)}
                            </div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Invoice #{completedInvoice.invoiceNumber}
                            </div>
                        </div>
                        {completedInvoice.customer && (
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Customer: <strong>{completedInvoice.customer.name}</strong>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                            <Button variant="outline" onClick={copyShareLink}>
                                <Copy size={16} style={{ marginRight: '6px' }} /> Copy Share Link
                            </Button>
                            <Button onClick={() => setCompletedInvoice(null)}>
                                New Sale
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Held Orders Modal */}
            <Modal isOpen={showHeldModal} onClose={() => setShowHeldModal(false)} title="Held Orders" maxWidth="500px">
                {isLoadingHeld ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                        Loading...
                    </div>
                ) : heldInvoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                        <Clock size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
                        <p>No held orders found</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                        {heldInvoices.map((inv: any) => (
                            <div key={inv.id} style={{
                                background: 'var(--glass-bg)',
                                padding: 'var(--space-3)',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                                        #{inv.invoiceNumber}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        {inv.customer?.name || 'Walk-in Customer'} · {inv.items.length} items · {formatCurrency(inv.total)}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        {new Date(inv.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancelHeldInvoice(inv.id)} style={{ color: 'var(--coral)' }}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleResumeInvoice(inv)}>
                                        Resume
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
            {/* Add Pet Modal */}
            <Modal isOpen={showPetModal} onClose={() => setShowPetModal(false)} title="Quick Add Pet" maxWidth="400px">
                <form onSubmit={handleAddPet} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input
                            label="Pet Name *"
                            value={newPet.name}
                            onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                            required
                        />
                        <div>
                            <label className="label">Type *</label>
                            <select
                                className="input"
                                value={newPet.type}
                                onChange={(e) => setNewPet({ ...newPet, type: e.target.value })}
                                required
                            >
                                <option value="Dog">Dog</option>
                                <option value="Cat">Cat</option>
                                <option value="Bird">Bird</option>
                                <option value="Fish">Fish</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input
                            label="Breed"
                            value={newPet.breed}
                            onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                        />
                        <Input
                            label="Weight (kg)"
                            type="number"
                            step="0.1"
                            value={newPet.weight}
                            onChange={(e) => setNewPet({ ...newPet, weight: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Dietary Needs (comma separated)"
                        value={newPet.dietaryNeeds}
                        onChange={(e) => setNewPet({ ...newPet, dietaryNeeds: e.target.value })}
                        placeholder="e.g. Grain-free, sensitive stomach"
                    />
                    <Input
                        label="Medical Conditions (comma separated)"
                        value={newPet.medicalConditions}
                        onChange={(e) => setNewPet({ ...newPet, medicalConditions: e.target.value })}
                    />
                    <Button type="submit" isLoading={isSubmittingPet} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
                        Save Pet
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
