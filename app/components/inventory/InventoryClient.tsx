'use client'

import { useState } from 'react'
import { getStoreInventory } from '@/app/actions/inventory'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { Search, AlertTriangle, ArrowUpDown } from 'lucide-react'

interface InventoryClientProps {
    storeId: string
    initialData: Awaited<ReturnType<typeof getStoreInventory>>
}

export function InventoryClient({ storeId, initialData }: InventoryClientProps) {
    const [search, setSearch] = useState('')
    const [showLowStock, setShowLowStock] = useState(false)

    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

    // Client-side filtering for simplicity given expected scale (< 500 products per store)
    const filteredData = initialData.filter(item => {
        if (showLowStock && !item.isLowStock) return false
        if (search) {
            const s = search.toLowerCase()
            return item.product.name.toLowerCase().includes(s) ||
                item.product.sku.toLowerCase().includes(s)
        }
        return true
    })

    // Calculate stats
    const totalItems = initialData.length
    const lowStockCount = initialData.filter(i => i.isLowStock).length
    const totalValue = initialData.reduce((sum, item) => sum + (item.quantity * item.product.price), 0)

    return (
        <div className="space-y-6">
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <GlassCard style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Total Products Cataloged</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{totalItems}</div>
                </GlassCard>
                <GlassCard style={{ flex: 1, borderColor: lowStockCount > 0 ? 'var(--coral)' : undefined }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: lowStockCount > 0 ? 'var(--coral)' : 'var(--text-muted)' }}>Low Stock Alerts</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: lowStockCount > 0 ? 'var(--coral)' : undefined }}>
                        {lowStockCount}
                    </div>
                </GlassCard>
                <GlassCard style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Est. Retail Value</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--teal)' }}>
                        ₹{(totalValue / 1000).toFixed(1)}K
                    </div>
                </GlassCard>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <Input
                        placeholder="Search products or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ width: '300px', marginBottom: 0 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                        <input
                            type="checkbox"
                            checked={showLowStock}
                            onChange={e => setShowLowStock(e.target.checked)}
                            style={{ accentColor: 'var(--coral)' }}
                        />
                        Show Low Stock Only
                    </label>
                </div>
            </div>

            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product Details</th>
                                <th>Category</th>
                                <th className="text-right">Stock Level</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                        No inventory records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.product.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                SKU: {item.product.sku} | Unit: {item.product.unit}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">
                                                {item.product.category.icon} {item.product.category.name}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div style={{
                                                fontSize: 'var(--text-lg)',
                                                fontWeight: 700,
                                                color: item.quantity === 0 ? 'var(--coral)' : item.isLowStock ? 'var(--warning)' : 'inherit'
                                            }}>
                                                {item.quantity}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                Target: {item.reorderPoint}
                                            </div>
                                        </td>
                                        <td>
                                            {item.quantity === 0 ? (
                                                <Badge variant="error" outline>Out of Stock</Badge>
                                            ) : item.isLowStock ? (
                                                <Badge variant="warning"><AlertTriangle size={12} className="inline mr-1" /> Low Stock</Badge>
                                            ) : (
                                                <Badge variant="success" outline>In Stock</Badge>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedProduct({
                                                    id: item.product.id,
                                                    name: item.product.name,
                                                    sku: item.product.sku,
                                                    unit: item.product.unit,
                                                    currentQuantity: item.quantity
                                                })}
                                            >
                                                <ArrowUpDown size={16} className="mr-2" /> Adjust
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <StockAdjustmentModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                storeId={storeId}
                product={selectedProduct}
                currentQuantity={selectedProduct?.currentQuantity || 0}
            />
        </div>
    )
}
