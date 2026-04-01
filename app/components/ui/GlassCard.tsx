import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean
}

export function GlassCard({
    className,
    noPadding = false,
    children,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn('glass-card', noPadding && 'p-0', className)}
            style={noPadding ? { padding: 0 } : undefined}
            {...props}
        >
            {children}
        </div>
    )
}
