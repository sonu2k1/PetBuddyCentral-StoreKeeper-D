import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'teal' | 'coral' | 'blue' | 'success' | 'warning' | 'error' | 'neutral'
    outline?: boolean
}

export function Badge({
    className,
    variant = 'neutral',
    outline = false,
    children,
    ...props
}: BadgeProps) {
    const variantClass = `badge-${variant}`
    const outlineClass = outline ? 'badge-outline' : ''

    return (
        <span
            className={cn('badge', variantClass, outlineClass, className)}
            {...props}
        >
            {children}
        </span>
    )
}
