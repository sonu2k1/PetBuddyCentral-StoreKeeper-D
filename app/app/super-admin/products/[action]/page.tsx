'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProduct, createProduct, updateProduct } from '@/app/actions/product'
import { getCategories } from '@/app/actions/category'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function ProductFormPage() {
    const params = useParams()
    const router = useRouter()
    const isEdit = params.action !== 'new'
    const productId = isEdit ? (params.action as string) : null

    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState('')
    const [categories, setCategories] = useState<any[]>([])

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        categoryId: '',
        unit: 'pcs',
        price: '',
        costPrice: '',
        description: '',
    })

    useEffect(() => {
        async function init() {
            try {
                const cats = await getCategories()
                setCategories(cats)
                if (cats.length > 0 && !isEdit) {
                    setFormData(f => ({ ...f, categoryId: cats[0].id }))
                }

                if (isEdit && productId) {
                    const product = await getProduct(productId)
                    setFormData({
                        name: product.name,
                        sku: product.sku,
                        categoryId: product.categoryId,
                        unit: product.unit,
                        price: product.price.toString(),
                        costPrice: product.costPrice?.toString() || '',
                        description: product.description || '',
                    })
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load product')
            } finally {
                setInitialLoading(false)
            }
        }
        init()
    }, [isEdit, productId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const payload = {
                name: formData.name,
                sku: formData.sku,
                categoryId: formData.categoryId,
                unit: formData.unit,
                price: parseFloat(formData.price),
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
                description: formData.description,
            }

            if (isEdit && productId) {
                await updateProduct(productId, payload)
            } else {
                await createProduct(payload)
            }

            router.push('/super-admin/products')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to save product')
            setLoading(false)
        }
    }

    if (initialLoading) {
        return <div className="page-body"><GlassCard>Loading...</GlassCard></div>
    }

    return (
        <>
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <Link href="/super-admin/products">
                        <Button variant="ghost" className="px-2">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
                </div>
            </header>

            <div className="page-body">
                <GlassCard className="max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 123, 123, 0.1)', color: 'var(--coral)', borderRadius: 'var(--glass-radius-sm)', border: '1px solid rgba(239, 123, 123, 0.2)' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <Input
                                label="Product Name"
                                placeholder="e.g. Premium Dog Food 10kg"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="SKU"
                                placeholder="Unique identifier"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label className="input-label" htmlFor="category">Category <span style={{ color: 'var(--coral)' }}>*</span></label>
                                <select
                                    id="category"
                                    className="input"
                                    style={{ appearance: 'none', backgroundColor: 'var(--glass-bg)' }}
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="unit">Unit</label>
                                <select
                                    id="unit"
                                    className="input"
                                    style={{ appearance: 'none', backgroundColor: 'var(--glass-bg)' }}
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="g">Grams (g)</option>
                                    <option value="l">Liters (L)</option>
                                    <option value="ml">Milliliters (ml)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <Input
                                label="Selling Price (₹)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                            <Input
                                label="Cost Price (₹)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="description">Description (Optional)</label>
                            <textarea
                                id="description"
                                className="input"
                                style={{ minHeight: '100px', resize: 'vertical' }}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                            <Link href="/super-admin/products">
                                <Button type="button" variant="ghost">Cancel</Button>
                            </Link>
                            <Button type="submit" isLoading={loading}>
                                <Save size={18} className="mr-2" />
                                {isEdit ? 'Save Changes' : 'Create Product'}
                            </Button>
                        </div>
                    </form>
                </GlassCard>
            </div>
        </>
    )
}
