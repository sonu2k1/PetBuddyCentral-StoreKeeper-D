'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createUser, updateUser, toggleUserActive } from '@/app/actions/user'
import { Search, Plus, Power, Shield, Store, UserCircle } from 'lucide-react'

const ROLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', icon: '👑', color: 'badge-teal' },
    { value: 'FRANCHISE_OWNER', label: 'Franchise Owner', icon: '🏪', color: 'badge-blue' },
    { value: 'STORE_MANAGER', label: 'Store Manager', icon: '👔', color: 'badge-warning' },
]

interface UsersClientProps {
    users: any[]
    stores: any[]
}

export function UsersClient({ users: initialUsers, stores }: UsersClientProps) {
    const [users, setUsers] = useState(initialUsers)
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [roleFilter, setRoleFilter] = useState('')

    // Form state
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'STORE_MANAGER', storeId: '',
    })

    const resetForm = () => setForm({ name: '', email: '', password: '', role: 'STORE_MANAGER', storeId: '' })

    const filteredUsers = users.filter((u: any) => {
        const matchSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        const matchRole = !roleFilter || u.role === roleFilter
        return matchSearch && matchRole
    })

    const handleAdd = async () => {
        setIsSubmitting(true)
        try {
            await createUser({
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                storeId: form.storeId || undefined,
            })
            setShowAddModal(false)
            resetForm()
            window.location.reload()
        } catch (e: any) {
            alert(e.message || 'Failed to create user')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!editingUser) return
        setIsSubmitting(true)
        try {
            await updateUser(editingUser.id, {
                name: form.name,
                email: form.email,
                role: form.role,
                storeId: form.storeId || null,
                password: form.password || undefined,
            })
            setEditingUser(null)
            resetForm()
            window.location.reload()
        } catch (e: any) {
            alert(e.message || 'Failed to update user')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = async (userId: string) => {
        try {
            await toggleUserActive(userId)
            window.location.reload()
        } catch (e: any) {
            alert(e.message)
        }
    }

    const openEdit = (user: any) => {
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            storeId: user.storeId || '',
        })
        setEditingUser(user)
    }

    const getRoleBadge = (role: string) => {
        const r = ROLES.find((r) => r.value === role)
        return r ? <span className={`badge ${r.color}`}>{r.icon} {r.label}</span> : <span className="badge">{role}</span>
    }

    // Stats
    const byRole = ROLES.map((r) => ({ ...r, count: users.filter((u: any) => u.role === r.value).length }))
    const activeCount = users.filter((u: any) => u.isActive).length

    return (
        <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <GlassCard>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Users</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{users.length}</div>
                    </div>
                </GlassCard>
                {byRole.map((r) => (
                    <GlassCard key={r.value}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.label}</div>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{r.count}</div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Filter / search bar */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', alignItems: 'center' }}>
                <div style={{ flex: 1, maxWidth: '320px' }}>
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                        className={`pos-category-tab ${!roleFilter ? 'pos-category-tab--active' : ''}`}
                        onClick={() => setRoleFilter('')}
                    >
                        All
                    </button>
                    {ROLES.map((r) => (
                        <button
                            key={r.value}
                            className={`pos-category-tab ${roleFilter === r.value ? 'pos-category-tab--active' : ''}`}
                            onClick={() => setRoleFilter(roleFilter === r.value ? '' : r.value)}
                        >
                            {r.icon} {r.label}
                        </button>
                    ))}
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <Button onClick={() => { resetForm(); setShowAddModal(true) }}>
                        <Plus size={16} style={{ marginRight: '6px' }} /> Add User
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <GlassCard noPadding>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Store</th>
                                <th>Status</th>
                                <th style={{ width: '140px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user: any) => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div
                                                style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: 'var(--glass-bg)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                                                }}
                                            >
                                                <UserCircle size={22} />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{user.email}</td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td style={{ fontSize: 'var(--text-sm)' }}>
                                        {user.store ? (
                                            <span>
                                                <Store size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {user.store.name}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggle(user.id)}
                                            >
                                                <Power size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Add User Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" maxWidth="500px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Input label="Full Name" placeholder="e.g. Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Email" placeholder="user@petbuddycentral.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Input label="Password" placeholder="Min 6 characters" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                            ))}
                        </select>
                    </div>
                    {form.role !== 'SUPER_ADMIN' && (
                        <div className="input-group">
                            <label className="input-label">Assigned Store</label>
                            <select className="input" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                                <option value="">— No Store —</option>
                                {stores.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={handleAdd} isLoading={isSubmitting} disabled={!form.name || !form.email || !form.password}>
                            Create User
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={!!editingUser} onClose={() => { setEditingUser(null); resetForm() }} title={`Edit ${editingUser?.name || 'User'}`} maxWidth="500px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Input label="New Password (leave blank to keep current)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                            ))}
                        </select>
                    </div>
                    {form.role !== 'SUPER_ADMIN' && (
                        <div className="input-group">
                            <label className="input-label">Assigned Store</label>
                            <select className="input" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                                <option value="">— No Store —</option>
                                {stores.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => { setEditingUser(null); resetForm() }}>Cancel</Button>
                        <Button onClick={handleEdit} isLoading={isSubmitting}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
