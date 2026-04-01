// Currency formatter for INR
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

// Format compact numbers (e.g., 1.2K, 3.5L)
export function formatCompact(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
}

// Format date
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

// Format date-time
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Calculate GST breakdown
export function calculateGST(subtotal: number, rate: number = 18) {
    const halfRate = rate / 2
    const taxAmount = (subtotal * rate) / 100
    const cgst = (subtotal * halfRate) / 100
    const sgst = (subtotal * halfRate) / 100
    const total = subtotal + taxAmount

    return {
        subtotal,
        taxRate: rate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        total: Math.round(total * 100) / 100,
    }
}

// Generate invoice number
export function generateInvoiceNumber(storeCode: string, sequence: number): string {
    return `PBC-${storeCode}-${String(sequence).padStart(5, '0')}`
}

// Get loyalty tier info
export function getLoyaltyTier(points: number): { tier: string; color: string; emoji: string } {
    if (points >= 5000) return { tier: 'GOLD', color: '#FFD700', emoji: '🥇' }
    if (points >= 2000) return { tier: 'SILVER', color: '#C0C0C0', emoji: '🥈' }
    return { tier: 'BRONZE', color: '#CD7F32', emoji: '🥉' }
}

// Truncate text
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str
    return `${str.slice(0, length)}…`
}

// cn utility for class names
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ')
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): T & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const debounced = (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), wait)
    }

    debounced.cancel = () => {
        if (timeoutId) clearTimeout(timeoutId)
    }

    return debounced as T & { cancel: () => void }
}
