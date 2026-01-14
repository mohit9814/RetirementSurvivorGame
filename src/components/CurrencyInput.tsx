import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    label: string;
    value: number;
    onChange: (newValue: number) => void;
    style?: React.CSSProperties;
}

type Unit = 'Raw' | 'L' | 'Cr';

const CurrencyInput: React.FC<CurrencyInputProps> = ({ label, value, onChange, style }) => {
    const [amount, setAmount] = useState<string>('');
    const [unit, setUnit] = useState<Unit>('L');

    // Initialize/Sync local state from prompt value
    useEffect(() => {
        // Determine best unit if not set by user interaction recently
        if (value >= 10000000) {
            setUnit('Cr');
            setAmount((value / 10000000).toString());
        } else if (value >= 100000) {
            setUnit('L');
            setAmount((value / 100000).toString());
        } else {
            setUnit('Raw');
            setAmount(value.toString());
        }
    }, [value]);

    const handleAmountChange = (val: string) => {
        setAmount(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            propagateChange(num, unit);
        }
    };

    const handleUnitChange = (newUnit: Unit) => {
        setUnit(newUnit);
        const num = parseFloat(amount);
        if (!isNaN(num)) {
            propagateChange(num, newUnit);
        }
    };

    const propagateChange = (val: number, currentUnit: Unit) => {
        let multiplier = 1;
        if (currentUnit === 'Cr') multiplier = 10000000;
        if (currentUnit === 'L') multiplier = 100000;

        onChange(val * multiplier);
    };

    return (
        <div style={{ marginBottom: '1rem', ...style }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {label}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
                <select
                    value={unit}
                    onChange={(e) => handleUnitChange(e.target.value as Unit)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <option value="Raw">₹</option>
                    <option value="L">Lakhs</option>
                    <option value="Cr">Crores</option>
                </select>
            </div>
        </div>
    );
};

export default CurrencyInput;
