'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { updateProfile, changePassword } from '@/app/actions/profile'
import { User, Lock } from 'lucide-react'

export function ProfileSettingsClient({ initialName = '' }: { initialName?: string }) {
    const { success, error } = useToast()
    const [name, setName] = useState(initialName)
    const [isUpdatingName, setIsUpdatingName] = useState(false)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsUpdatingName(true)
        try {
            await updateProfile({ name })
            success('Profile name updated successfully')
        } catch (err: any) {
            error(err.message)
        }
        setIsUpdatingName(false)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            error('New passwords do not match')
            return
        }
        if (newPassword.length < 6) {
            error('New password must be at least 6 characters')
            return
        }

        setIsUpdatingPassword(true)
        try {
            await changePassword({ currentPassword, newPassword })
            success('Password changed successfully')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            error(err.message)
        }
        setIsUpdatingPassword(false)
    }

    return (
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
            {/* Profile Information */}
            <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--pbc-teal-subtle)', color: 'var(--pbc-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Personal Information</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Update your display name.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateName} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', maxWidth: '400px' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" isLoading={isUpdatingName} disabled={name === initialName}>
                        Update
                    </Button>
                </form>
            </GlassCard>

            {/* Change Password */}
            <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255, 107, 107, 0.1)', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Security</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Update your password to keep your account secure.</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '400px' }}>
                    <Input
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <div style={{ alignSelf: 'flex-start' }}>
                        <Button type="submit" isLoading={isUpdatingPassword}>
                            Change Password
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </div>
    )
}
