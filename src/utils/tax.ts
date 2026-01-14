
export const calculateNewRegimeTax = (grossIncome: number): number => {
    // 1. Standard Deduction: ₹75,000
    const standardDeduction = 75000;
    const income = Math.max(0, grossIncome - standardDeduction);

    // 2. Rebate u/s 87A: If Taxable Income <= 12 Lakhs, Tax is 0
    // (As per user screenshot saying nil-tax threshold raised to 12L)
    if (income <= 1200000) return 0;

    let tax = 0;

    // Slab 1: 0 - 4L (Nil)
    // Slab 2: 4L - 8L (5%)
    if (income > 400000) {
        const slab = Math.min(income, 800000) - 400000;
        tax += slab * 0.05;
    }

    // Slab 3: 8L - 12L (10%)
    if (income > 800000) {
        const slab = Math.min(income, 1200000) - 800000;
        tax += slab * 0.10;
    }

    // Slab 4: 12L - 16L (15%)
    if (income > 1200000) {
        const slab = Math.min(income, 1600000) - 1200000;
        tax += slab * 0.15;
    }

    // Slab 5: 16L - 20L (20%)
    if (income > 1600000) {
        const slab = Math.min(income, 2000000) - 1600000;
        tax += slab * 0.20;
    }

    // Slab 6: 20L - 24L (25%)
    if (income > 2000000) {
        const slab = Math.min(income, 2400000) - 2000000;
        tax += slab * 0.25;
    }

    // Slab 7: Above 24L (30%)
    if (income > 2400000) {
        const slab = income - 2400000;
        tax += slab * 0.30;
    }

    // 3. Health & Education Cess: 4%
    return tax * 1.04;
};

export const calculateLTCG = (gain: number): number => {
    const exemption = 125000; // 1.25 Lakhs
    if (gain <= exemption) return 0;

    return (gain - exemption) * 0.125; // 12.5%
};
