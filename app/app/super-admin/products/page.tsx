import { getProducts } from '@/app/actions/product'
import { ProductListClient } from './ProductListClient'
import { Suspense } from 'react'

export const metadata = {
    title: 'Products | PetBuddyCentral',
}

export default async function ProductsPage() {
    const initialData = await getProducts({ limit: 100 })

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Product Catalog</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="badge badge-teal">Global Catalog</span>
                </div>
            </header>

            <div className="page-body">
                <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        Manage Products
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        View and manage the global product catalog. Changes here apply to all franchise stores.
                    </p>
                </div>

                <Suspense fallback={<div className="glass-card">Loading products...</div>}>
                    <ProductListClient initialData={initialData} />
                </Suspense>
            </div>
        </>
    )
}
