'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { openCashDrawer, reconcileCashDrawer } from '@/app/actions/cashDrawer'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, Wallet, CheckCircle, AlertTriangle } from 'lucide-react'

interface CashDrawerWidgetProps {
    drawer: any | null
}

export function CashDrawerWidget({ drawer: initialDrawer }: CashDrawerWidgetProps) {
    const [drawer, setDrawer] = useState(initialDrawer)
    const [showOpen, setShowOpen] = useState(false)
    const [showReconcile, setShowReconcile] = useState(false)
    const [startingFloat, setStartingFloat] = useState('500')
    const [actualCash, setActualCash] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleOpen = async () => {
        setIsLoading(true)
        try {
            const d = await openCashDrawer(parseFloat(startingFloat) || 500)
            setDrawer(d)
            setShowOpen(false)
        } catch (e: any) { alert(e.message) }
        setIsLoading(false)
    }

    const handleReconcile = async () => {
        if (!drawer) return
        setIsLoading(true)
        try {
            const res = await reconcileCashDrawer(drawer.id, parseFloat(actualCash) || 0)
            setResult(res)
            setDrawer({ ...drawer, isReconciled: true, actualCash: res.actualCash, variance: res.variance })
        } catch (e: any) { alert(e.message) }
        setIsLoading(false)
    }

    // Parse movements
    const movements = drawer?.movements ? JSON.parse(drawer.movements) : []
    const expectedCash = drawer?.expectedCash || drawer?.startingFloat || 0

    if (!drawer) {
        return (
            <>
                <GlassCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Wallet size={16} /> Cash Drawer
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                                Drawer not opened today
                            </p>
                        </div>
                        <Button onClick={() => setShowOpen(true)}>
                            <DollarSign size={16} style={{ marginRight: '4px' }} /> Open Drawer
                        </Button>
                    </div>
                </GlassCard>

                <Modal isOpen={showOpen} onClose={() => setShowOpen(false)} title="Open Cash Drawer" maxWidth="400px">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <Input
                            label="Starting Float (₹)"
                            type="number"
                            value={startingFloat}
                            onChange={(e) => setStartingFloat(e.target.value)}
                        />
                        <Button onClick={handleOpen} isLoading={isLoading}>Open Drawer</Button>
                    </div>
                </Modal>
            </>
        )
    }

    return (
        <>
            <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wallet size={16} style={{ color: drawer.isReconciled ? 'var(--text-muted)' : 'var(--pbc-teal)' }} />
                        Cash Drawer
                        {drawer.isReconciled ? (
                            <span className="badge badge-success">Reconciled</span>
                        ) : (
                            <span className="badge badge-warning">Open</span>
                        )}
                    </h3>
                    {!drawer.isReconciled && (
                        <Button variant="outline" size="sm" onClick={() => setShowReconcile(true)}>
                            <CheckCircle size={14} style={{ marginRight: '4px' }} /> Close Day
                        </Button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Float</div>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(drawer.startingFloat)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Expected</div>
                        <div style={{ fontWeight: 700, color: 'var(--pbc-teal)' }}>{formatCurrency(expectedCash)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Movements</div>
                        <div style={{ fontWeight: 700 }}>{movements.length}</div>
                    </div>
                </div>

                {drawer.isReconciled && drawer.variance !== null && (
                    <div style={{
                        marginTop: 'var(--space-3)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: '8px',
                        background: Math.abs(drawer.variance) < 1 ? 'rgba(0,200,150,0.1)' : 'rgba(255,107,107,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: 'var(--text-sm)',
                    }}>
                        {Math.abs(drawer.variance) < 1 ? (
                            <><CheckCircle size={16} style={{ color: 'var(--pbc-teal)' }} /> Balanced</>
                        ) : (
                            <><AlertTriangle size={16} style={{ color: 'var(--coral)' }} /> Variance: {formatCurrency(drawer.variance)}</>
                        )}
                    </div>
                )}
            </GlassCard>

            <Modal isOpen={showReconcile} onClose={() => setShowReconcile(false)} title="Reconcile Cash Drawer" maxWidth="450px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ background: 'var(--glass-bg)', padding: 'var(--space-3)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Starting Float</span>
                            <strong>{formatCurrency(drawer.startingFloat)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Expected Cash</span>
                            <strong style={{ color: 'var(--pbc-teal)' }}>{formatCurrency(expectedCash)}</strong>
                        </div>
                    </div>
                    <Input
                        label="Actual Cash in Drawer (₹)"
                        type="number"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        placeholder={String(expectedCash)}
                    />
                    {result && (
                        <div style={{
                            padding: 'var(--space-3)',
                            borderRadius: '8px',
                            background: Math.abs(result.variance) < 1 ? 'rgba(0,200,150,0.1)' : 'rgba(255,107,107,0.1)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                                {Math.abs(result.variance) < 1 ? '✅ Balanced!' : `⚠️ Variance: ${formatCurrency(result.variance)}`}
                            </div>
                        </div>
                    )}
                    {!result && <Button onClick={handleReconcile} isLoading={isLoading}>Reconcile & Close</Button>}
                </div>
            </Modal>
        </>
    )
}
