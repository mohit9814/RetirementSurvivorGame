import React, { useState } from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import type { BucketState, YearlyResult } from '../types';
import { formatCurrency } from '../utils/currency';

interface BucketCardProps {
    bucket: BucketState;
    history: YearlyResult[];
    totalWealth: number;
    index: number;
    currentYear: number;
    isTransferSource?: boolean;
    isTransferTarget?: boolean;
    maxTransferableAmount?: number;
    onTransferInitiate?: () => void;
    onTransferComplete?: (amount: number) => void;
}

const BucketCard: React.FC<BucketCardProps> = ({
    bucket, history, totalWealth, index, currentYear, isTransferSource, isTransferTarget, maxTransferableAmount = 0, onTransferInitiate, onTransferComplete
}) => {
    const [transferPercent, setTransferPercent] = useState(0); // 0 to 100
    const [transferInput, setTransferInput] = useState(''); // User input for Lakhs

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    const percentage = totalWealth > 0 ? (bucket.balance / totalWealth) * 100 : 0;

    // Prepare chart data (Last 30 years or all)
    const chartData = history.map(h => ({
        year: h.year,
        return: h.buckets[index].lastYearReturn * 100
    })).filter(h => h.year > 0); // Skip year 0

    // Average Line
    const avgReturn = chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.return, 0) / chartData.length
        : 0;

    const handleTransferSubmit = () => {
        // Calculate amount from percentage to ensure precision
        const amount = (transferPercent / 100) * maxTransferableAmount;
        if (onTransferComplete && amount > 0) {
            onTransferComplete(amount);
            setTransferPercent(0);
            setTransferInput('');
        }
    };



    return (
        <div className={`glass-panel`}
            style={{
                width: '100%',
                padding: isMobile ? '0.5rem' : '1rem',
                flex: 1,
                minWidth: isMobile ? 'unset' : '300px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '0.25rem' : '0.75rem',
                border: isTransferSource ? '1px solid var(--color-accent)' : (isTransferTarget ? '1px solid var(--color-success)' : '1px solid var(--glass-border)'),
                boxShadow: isTransferSource ? '0 0 15px rgba(56, 189, 248, 0.2)' : (isTransferTarget ? '0 0 15px rgba(34, 197, 94, 0.2)' : 'var(--glass-shadow)'),
                transform: isTransferTarget ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: isTransferTarget ? 'pointer' : 'default',
                overflow: 'visible'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.5rem' }}>
                    <div style={{
                        width: isMobile ? '6px' : '8px', height: isMobile ? '6px' : '8px', borderRadius: '50%',
                        background: getBucketColor(bucket.type),
                        boxShadow: `0 0 8px ${getBucketColor(bucket.type)}`
                    }} />
                    <h3 style={{ fontSize: isMobile ? '0.65rem' : '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        {isMobile ? bucket.type : bucket.name}
                    </h3>
                </div>
                {!isMobile && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        {index === 0 ? 'LIQUID' : index === 1 ? 'INCOME' : 'GROWTH'}
                    </span>
                )}
            </div>

            {/* Premium Visualization */}
            <div style={{ position: 'relative', height: isMobile ? '40px' : '100px', background: 'rgba(0,0,0,0.3)', borderRadius: isMobile ? '6px' : '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Liquid Fill */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: `${Math.max(percentage, 5)}%`,
                    background: getBucketGradient(bucket.type),
                    transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: 0.9,
                    boxShadow: '0 0 20px rgba(0,0,0,0.3) inset'
                }} />

                {/* Meniscus / Top highlight */}
                {!isMobile && (
                    <div style={{
                        position: 'absolute', bottom: `${Math.max(percentage, 5)}%`, left: 0, right: 0,
                        height: '2px', background: 'rgba(255,255,255,0.5)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                        transition: 'bottom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} />
                )}

                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 2
                }}>
                    <span className="hero-text" style={{ fontSize: isMobile ? '0.9rem' : '2rem', lineHeight: 1 }}>{percentage.toFixed(0)}<span style={{ fontSize: isMobile ? '0.7rem' : '1rem', opacity: 0.8 }}>%</span></span>
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div className="hero-text" style={{ fontSize: isMobile ? '0.8rem' : '1.5rem', marginBottom: isMobile ? '0' : '0.25rem' }}>{formatCurrency(bucket.balance)}</div>
                <div style={{
                    fontSize: isMobile ? '0.6rem' : '0.85rem', fontWeight: 600,
                    color: (bucket.lastYearReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)'),
                    background: (bucket.lastYearReturn >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)'),
                    display: 'inline-block', padding: isMobile ? '0 0.3rem' : '0.1rem 0.5rem', borderRadius: '4px'
                }}>
                    {bucket.lastYearReturn > 0 ? '+' : ''}{(bucket.lastYearReturn * 100).toFixed(isMobile ? 1 : 2)}%
                </div>

                {/* Floating Investment Gain/Loss Animation - Hidden on Mobile */}
                {!isMobile && currentYear > 0 && (
                    <div
                        key={currentYear}
                        style={{
                            position: 'absolute',
                            top: `${10 + (currentYear % 3) * 5}%`,
                            right: '5%',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            color: bucket.lastYearReturn >= 0 ? '#4ade80' : '#ef4444',
                            background: 'rgba(15, 23, 42, 0.9)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            animation: 'float-fade 4s ease-out forwards',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                            zIndex: 20,
                            opacity: Math.abs(bucket.lastYearReturn) < 0.000001 ? 0 : 1
                        }}
                    >
                        {Math.abs(bucket.lastYearReturn) < 0.000001 ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No Change</span>
                        ) : (
                            <>
                                {bucket.lastYearReturn > 0 ? '+' : '-'}{formatCurrency(Math.abs(bucket.balance * (bucket.lastYearReturn / (1 + bucket.lastYearReturn))))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Historical Return Mini-Chart (Sparkline) - Hidden on Mobile */}
            {!isMobile && chartData.length > 2 && (
                <div style={{ flex: 1, minHeight: '60px', marginTop: '0.5rem', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', fontSize: '0.75rem', borderRadius: '4px', padding: '4px 8px' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(val: any) => [`${val.toFixed(2)}%`, 'Return']}
                                labelFormatter={(label) => `Year ${label}`}
                            />
                            <ReferenceLine y={avgReturn} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                            <Bar dataKey="return" radius={[2, 2, 0, 0]}>
                                {chartData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.return >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                        Avg: {avgReturn.toFixed(1)}%
                    </div>
                </div>
            )}

            {/* Actions - Simplified on Mobile */}
            <div style={{ marginTop: 'auto', paddingTop: isMobile ? '0.25rem' : '1rem', borderTop: isMobile ? 'none' : '1px dashed rgba(255,255,255,0.1)' }}>
                {isTransferTarget ? (
                    <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Amount</label>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{transferPercent.toFixed(1)}%</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={transferInput}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTransferInput(val);

                                    // Live Parse Attempt (Debounce ideally, but direct for now)
                                    let numVal = parseFloat(val.replace(/[^0-9.]/g, ''));
                                    if (!isNaN(numVal) && maxTransferableAmount > 0) {
                                        // Detect Unit context
                                        const lowerVal = val.toLowerCase();
                                        if (lowerVal.includes('c')) numVal *= 10000000;
                                        else if (lowerVal.includes('l')) numVal *= 100000;
                                        else if (lowerVal.includes('k')) numVal *= 1000;
                                        // Default assumption: specific raw value if no unit provided? 
                                        // Actually, let's assume raw if no suffix, unless it's tiny (<100) then maybe it's percentage? 
                                        // No, stay consistent: Raw number = Rupees. 

                                        const pct = Math.min(100, Math.max(0, (numVal / maxTransferableAmount) * 100));
                                        setTransferPercent(pct);
                                    }
                                }}
                                onBlur={() => {
                                    // On blur, re-format nicely
                                    const amt = (transferPercent / 100) * maxTransferableAmount;
                                    setTransferInput(formatCurrency(amt));
                                }}
                                placeholder="₹0"
                                autoFocus
                                style={{
                                    width: '100px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.1)', color: 'white', textAlign: 'right', fontSize: '0.85rem'
                                }}
                            />
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={transferPercent}
                                    onChange={(e) => {
                                        const pct = parseFloat(e.target.value);
                                        setTransferPercent(pct);
                                        const amt = (pct / 100) * maxTransferableAmount;
                                        setTransferInput(formatCurrency(amt));
                                    }}
                                    style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                                />
                            </div>
                            <button className="btn" style={{ background: 'var(--color-success)', padding: '0.25rem 0.5rem', minWidth: '32px' }} onClick={handleTransferSubmit}>
                                ✓
                            </button>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                            Max: {formatCurrency(maxTransferableAmount)}
                        </div>
                    </div>
                ) : (
                    <button
                        className="btn"
                        style={{ width: '100%', background: isTransferSource ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.1)' }}
                        onClick={(e) => { e.stopPropagation(); onTransferInitiate?.(); }}
                    >
                        {isTransferSource ? 'Cancel Transfer' : 'Move Funds'}
                    </button>
                )}
            </div>
        </div>
    );
};


function getBucketColor(type: string) {
    switch (type) {
        case 'Cash': return 'var(--color-accent)';
        case 'Income': return 'var(--color-warning)';
        case 'Growth': return 'var(--color-success)';
        default: return '#ccc';
    }
}

function getBucketGradient(type: string) {
    switch (type) {
        case 'Cash': return 'var(--gradient-primary)';
        case 'Income': return 'var(--gradient-warning)';
        case 'Growth': return 'var(--gradient-success)';
        default: return 'linear-gradient(to top, #ccc, #eee)';
    }
}

export default BucketCard;
