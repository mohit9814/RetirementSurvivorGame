import React, { useState } from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, Tooltip, ReferenceLine } from 'recharts';
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
    onTransferInitiate?: () => void;
    onTransferComplete?: (amount: number) => void;
}

const BucketCard: React.FC<BucketCardProps> = ({
    bucket, history, totalWealth, index, currentYear, isTransferSource, isTransferTarget, onTransferInitiate, onTransferComplete
}) => {
    const [transferAmount, setTransferAmount] = useState(0);

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

    const handleTransferSubmit = (rawAmount: number) => {
        if (onTransferComplete && rawAmount > 0) {
            onTransferComplete(rawAmount);
            setTransferAmount(0);
        }
    };

    return (
        <div className={`glass-panel`}
            style={{
                width: '100%',
                padding: '1rem', flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                border: isTransferSource ? '1px solid var(--color-accent)' : (isTransferTarget ? '1px solid var(--color-success)' : '1px solid var(--glass-border)'),
                boxShadow: isTransferSource ? '0 0 15px rgba(56, 189, 248, 0.2)' : (isTransferTarget ? '0 0 15px rgba(34, 197, 94, 0.2)' : 'var(--glass-shadow)'),
                transform: isTransferTarget ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: isTransferTarget ? 'pointer' : 'default',
                overflow: 'visible'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: getBucketColor(bucket.type),
                        boxShadow: `0 0 8px ${getBucketColor(bucket.type)}`
                    }} />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        {bucket.name}
                    </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {index === 0 ? 'LIQUID' : index === 1 ? 'INCOME' : 'GROWTH'}
                </span>
            </div>

            {/* Premium Visualization */}
            <div style={{ position: 'relative', height: '100px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                <div style={{
                    position: 'absolute', bottom: `${Math.max(percentage, 5)}%`, left: 0, right: 0,
                    height: '2px', background: 'rgba(255,255,255,0.5)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                    transition: 'bottom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} />

                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 2
                }}>
                    <span className="hero-text" style={{ fontSize: '2rem', lineHeight: 1 }}>{percentage.toFixed(0)}<span style={{ fontSize: '1rem', opacity: 0.7 }}>%</span></span>
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div className="hero-text" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{formatCurrency(bucket.balance)}</div>
                <div style={{
                    fontSize: '0.85rem', fontWeight: 600,
                    color: (bucket.lastYearReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)'),
                    background: (bucket.lastYearReturn >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)'),
                    display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: '4px'
                }}>
                    {bucket.lastYearReturn > 0 ? '+' : ''}{(bucket.lastYearReturn * 100).toFixed(2)}% Return
                </div>

                {/* Floating Investment Gain/Loss Animation */}
                {currentYear > 0 && Math.abs(bucket.lastYearReturn) > 0.0001 && (
                    <div
                        key={currentYear} // Restart animation on year change
                        style={{
                            position: 'absolute',
                            top: '40%', // Start near balance
                            right: '5%',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            color: bucket.lastYearReturn >= 0 ? '#4ade80' : '#ef4444',
                            animation: 'float-fade 2s ease-out forwards',
                            pointerEvents: 'none',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            zIndex: 10
                        }}
                    >
                        {bucket.lastYearReturn > 0 ? '+' : '-'}{formatCurrency(Math.abs(bucket.balance * (bucket.lastYearReturn / (1 + bucket.lastYearReturn))))}
                    </div>
                )}
            </div>

            {/* Historical Return Mini-Chart (Sparkline) */}
            {chartData.length > 2 && (
                <div style={{ flex: 1, minHeight: '60px', marginTop: '0.5rem', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', fontSize: '0.75rem', borderRadius: '4px', padding: '4px 8px' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(val: number) => [`${val.toFixed(2)}%`, 'Return']}
                                labelFormatter={(label) => `Year ${label}`}
                            />
                            {/* Dotted Average Line */}
                            <ReferenceLine y={avgReturn} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                            <Bar dataKey="return" radius={[2, 2, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.return >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                        Avg: {avgReturn.toFixed(1)}%
                    </div>
                </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                {isTransferTarget ? (
                    <div onClick={e => e.stopPropagation()}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Amount (Lakhs)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                value={transferAmount === 0 ? '' : transferAmount}
                                onChange={e => setTransferAmount(parseFloat(e.target.value))}
                                placeholder="0"
                                autoFocus
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)',
                                    background: 'rgba(0,0,0,0.3)', color: 'white'
                                }}
                            />
                            <button className="btn" style={{ background: 'var(--color-success)', padding: '0.5rem 1rem' }} onClick={() => {
                                // User enters Lakhs, we convert to absolute for logic
                                handleTransferSubmit(transferAmount * 100000);
                            }}>
                                ✓
                            </button>
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
