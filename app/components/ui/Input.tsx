import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, id, ...props }, ref) => {
        const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

        return (
            <div className={cn('input-group', className)}>
                {label && (
                    <label className="input-label" htmlFor={inputId}>
                        {label}
                        {props.required && <span style={{ color: 'var(--coral)' }}> *</span>}
                    </label>
                )}
                <div className={icon ? 'input-with-icon' : ''}>
                    {icon && <div className="input-icon">{icon}</div>}
                    <input
                        id={inputId}
                        ref={ref}
                        className={cn('input', error && 'input-error')}
                        {...props}
                    />
                </div>
                {error && <div className="input-error-msg">{error}</div>}
            </div>
        )
    }
)
Input.displayName = 'Input'
