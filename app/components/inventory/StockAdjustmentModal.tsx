'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { adjustStock } from '@/app/actions/inventory'

interface StockAdjustmentModalProps {
    isOpen: boolean
    onClose: () => void
    storeId: string
    product: { id: string; name: string; sku: string; unit: string } | null
    currentQuantity: number
    onSuccess?: () => void
}

export function StockAdjustmentModal({
    isOpen,
    onClose,
    storeId,
    product,
    currentQuantity,
    onSuccess,
}: StockAdjustmentModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add')
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState<'Restock' | 'Damage' | 'Correction' | 'Return' | 'Transfer'>('Restock')
    const [notes, setNotes] = useState('')

    if (!product) return null

    const calculateNewQuantity = () => {
        const val = parseFloat(amount) || 0
        if (adjustmentType === 'set') return val
        if (adjustmentType === 'add') return currentQuantity + val
        if (adjustmentType === 'subtract') return Math.max(0, currentQuantity - val)
        return currentQuantity
    }

    const newQty = calculateNewQuantity()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!amount || parseFloat(amount) <= 0 && adjustmentType !== 'set') {
            setError('Amount must be greater than 0')
            return
        }

        setLoading(true)

        try {
            await adjustStock({
                storeId,
                productId: product.id,
                newQuantity: newQty,
                reason,
                notes,
            })
            onSuccess?.()
            onClose()
            setAmount('')
            setNotes('')
        } catch (err: any) {
            setError(err.message || 'Failed to adjust stock')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div style={{ padding: 'var(--space-2)', color: 'var(--coral)', background: 'rgba(239,123,123,0.1)', borderRadius: '6px' }}>
                        {error}
                    </div>
                )}

                <div style={{ padding: 'var(--space-3)', background: 'var(--glass-bg)', borderRadius: 'var(--glass-radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        SKU: {product.sku} | Current Stock: <strong style={{ color: 'var(--text-primary)' }}>{currentQuantity} {product.unit}</strong>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                        <label className="input-label">Action</label>
                        <select
                            className="input"
                            value={adjustmentType}
                            onChange={(e) => setAdjustmentType(e.target.value as any)}
                        >
                            <option value="add">Add Stock (+)</option>
                            <option value="subtract">Remove Stock (-)</option>
                            <option value="set">Set Exact Stock (=)</option>
                        </select>
                    </div>

                    <Input
                        label={`Amount (${product.unit})`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Reason</label>
                    <select
                        className="input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as any)}
                    >
                        <option value="Restock">Supplier Restock</option>
                        <option value="Correction">Inventory Count Correction</option>
                        <option value="Damage">Damage / Spoilage</option>
                        <option value="Return">Customer Return</option>
                        <option value="Transfer">Store Transfer</option>
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Notes (Optional)</label>
                    <Input
                        placeholder="e.g. Broken during transit"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div style={{ padding: 'var(--space-3)', background: 'rgba(42,170,138,0.1)', borderRadius: '6px', textAlign: 'center' }}>
                    New Stock Level: <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--teal)' }}>{newQty} {product.unit}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" isLoading={loading}>Confirm Adjustment</Button>
                </div>
            </form>
        </Modal>
    )
}
