'use client'

import { useState } from 'react'
import { getProducts, deleteProduct } from '@/app/actions/product'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface ProductListProps {
    initialData: Awaited<ReturnType<typeof getProducts>>
}

export function ProductListClient({ initialData }: ProductListProps) {
    const [search, setSearch] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Use a simple custom hook wrapper or local state for search fetching
    // For simplicity, we filter the initialData client-side if it's small, 
    // but real-world would do server actions on debounced search.
    // We'll map initialData for now as a server component passes it down.
    const [data, setData] = useState(initialData)

    const filteredProducts = data.products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        setDeletingId(id)
        try {
            await deleteProduct(id)
            setData(prev => ({
                ...prev,
                products: prev.products.filter(p => p.id !== id),
                total: prev.total - 1
            }))
        } catch (error: any) {
            alert(error.message || 'Failed to delete product')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Input
                    placeholder="Search by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={18} />}
                    style={{ width: '300px', marginBottom: 0 }}
                />
                <Link href="/super-admin/products/new">
                    <Button>
                        <Plus size={18} className="mr-2" /> Add Product
                    </Button>
                </Link>
            </div>

            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Selling Price</th>
                                <th>Cost Price</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                        No products found matching &quot;{search}&quot;
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{product.name}</div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                Unit: {product.unit}
                                            </div>
                                        </td>
                                        <td><code style={{ fontSize: 'var(--text-xs)' }}>{product.sku}</code></td>
                                        <td>
                                            <span className="badge badge-neutral">
                                                {product.category.icon} {product.category.name}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {product.costPrice ? formatCurrency(product.costPrice) : '-'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                                <Link href={`/super-admin/products/${product.id}`}>
                                                    <Button variant="ghost" size="sm" aria-label="Edit">
                                                        <Edit2 size={16} />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={deletingId === product.id}
                                                    aria-label="Delete"
                                                    style={{ color: 'var(--coral)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    )
}
