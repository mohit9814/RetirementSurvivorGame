// Indian Currency Formatting Utility

export const formatCurrency = (value: number, decimals: number = 2): string => {
    if (value === 0) return '₹0';
    if (!Number.isFinite(value) || Number.isNaN(value)) return '₹---';

    const absValue = Math.abs(value);

    if (absValue >= 10000000) { // 1 Crore
        const val = value / 10000000;
        return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} Cr`;
    }

    if (absValue >= 100000) { // 1 Lakh
        const val = value / 100000;
        return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} L`;
    }

    // Fallback to standard Indian format for smaller amounts
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

export const parseCurrency = (value: number, unit: 'Raw' | 'L' | 'Cr'): number => {
    switch (unit) {
        case 'Cr': return value * 10000000;
        case 'L': return value * 100000;
        default: return value;
    }
};
