'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateOrgSettings } from '@/app/actions/settings'
import { Building2, Mail, Phone, Globe, Hash, Save, CheckCircle } from 'lucide-react'

interface SuperAdminSettingsClientProps {
    org: any
}

export function SuperAdminSettingsClient({ org }: SuperAdminSettingsClientProps) {
    const [form, setForm] = useState({
        name: org.name || '',
        email: org.email || '',
        phone: org.phone || '',
        website: org.website || '',
        gstNumber: org.gstNumber || '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleSave = async () => {
        setIsSubmitting(true)
        try {
            await updateOrgSettings(form)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (e: any) {
            alert(e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '700px' }}>
            {/* Org Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                {[
                    { label: 'Stores', value: org._count?.stores || 0, icon: '🏪' },
                    { label: 'Users', value: org._count?.users || 0, icon: '👥' },
                    { label: 'Products', value: org._count?.products || 0, icon: '📦' },
                    { label: 'Customers', value: org._count?.customers || 0, icon: '👤' },
                ].map((s) => (
                    <GlassCard key={s.label}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{s.value}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Organization Info */}
            <GlassCard>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} /> Organization Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Input label="Organization Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={<Building2 size={16} />} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} icon={<Mail size={16} />} />
                        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} icon={<Phone size={16} />} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} icon={<Globe size={16} />} />
                        <Input label="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} icon={<Hash size={16} />} />
                    </div>
                </div>
            </GlassCard>

            {/* System Info */}
            <GlassCard>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🔧 System Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Org Slug:</span> <code>{org.slug}</code></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Created:</span> {new Date(org.createdAt).toLocaleDateString()}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Org ID:</span> <code style={{ fontSize: '10px' }}>{org.id}</code></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>DB:</span> SQLite</div>
                </div>
            </GlassCard>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleSave} isLoading={isSubmitting}>
                    {saved ? (
                        <><CheckCircle size={16} style={{ marginRight: '6px' }} /> Saved!</>
                    ) : (
                        <><Save size={16} style={{ marginRight: '6px' }} /> Save Changes</>
                    )}
                </Button>
            </div>
        </div>
    )
}
