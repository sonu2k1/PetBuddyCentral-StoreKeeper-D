'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { clockIn, clockOut, addBreak, endBreak } from '@/app/actions/shift'
import { Clock, Play, Pause, StopCircle, Coffee } from 'lucide-react'

interface ShiftClockProps {
    activeShift: any | null
}

export function ShiftClock({ activeShift: initialShift }: ShiftClockProps) {
    const [shift, setShift] = useState(initialShift)
    const [elapsed, setElapsed] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [onBreak, setOnBreak] = useState(false)

    // Parse ongoing break
    useEffect(() => {
        if (shift?.breaks) {
            try {
                const breaks = JSON.parse(shift.breaks)
                const last = breaks[breaks.length - 1]
                setOnBreak(last && !last.end)
            } catch { setOnBreak(false) }
        }
    }, [shift])

    // Live timer
    useEffect(() => {
        if (!shift) return
        const update = () => {
            const diff = Date.now() - new Date(shift.clockIn).getTime()
            const hrs = Math.floor(diff / 3600000)
            const mins = Math.floor((diff % 3600000) / 60000)
            const secs = Math.floor((diff % 60000) / 1000)
            setElapsed(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
        }
        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [shift])

    const handleClockIn = async () => {
        setIsLoading(true)
        try {
            const newShift = await clockIn()
            setShift(newShift)
        } catch (e: any) { alert(e.message) }
        setIsLoading(false)
    }

    const handleClockOut = async () => {
        if (!shift) return
        if (!confirm('Clock out and end your shift?')) return
        setIsLoading(true)
        try {
            await clockOut(shift.id)
            setShift(null)
            setElapsed('')
        } catch (e: any) { alert(e.message) }
        setIsLoading(false)
    }

    const handleBreak = async () => {
        if (!shift) return
        setIsLoading(true)
        try {
            if (onBreak) {
                await endBreak(shift.id)
                setOnBreak(false)
            } else {
                await addBreak(shift.id)
                setOnBreak(true)
            }
        } catch (e: any) { alert(e.message) }
        setIsLoading(false)
    }

    if (!shift) {
        return (
            <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} /> Shift Status
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                            You are not clocked in
                        </p>
                    </div>
                    <Button onClick={handleClockIn} isLoading={isLoading}>
                        <Play size={16} style={{ marginRight: '4px' }} /> Clock In
                    </Button>
                </div>
            </GlassCard>
        )
    }

    return (
        <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} style={{ color: onBreak ? 'var(--warning)' : 'var(--pbc-teal)' }} />
                        {onBreak ? 'On Break' : 'On Shift'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '6px' }}>
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: 'var(--text-2xl)',
                            fontWeight: 800,
                            color: onBreak ? 'var(--warning)' : 'var(--pbc-teal)',
                            letterSpacing: '2px',
                        }}>
                            {elapsed}
                        </span>
                        <span className={`badge ${onBreak ? 'badge-warning' : 'badge-success'}`} style={{ animation: 'pulse 2s infinite' }}>
                            {onBreak ? '☕ Break' : '● Live'}
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Started {new Date(shift.clockIn).toLocaleTimeString()}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="outline" size="sm" onClick={handleBreak} isLoading={isLoading}>
                        {onBreak ? <><Play size={14} style={{ marginRight: '4px' }} /> Resume</> : <><Coffee size={14} style={{ marginRight: '4px' }} /> Break</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClockOut} isLoading={isLoading} style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>
                        <StopCircle size={14} style={{ marginRight: '4px' }} /> Clock Out
                    </Button>
                </div>
            </div>
        </GlassCard>
    )
}
