import React from 'react';
import { formatCurrency } from '../utils/currency';
import type { YearlyResult } from '../types';

interface MissionLogProps {
    history: YearlyResult[];
}

const MissionLog: React.FC<MissionLogProps> = ({ history }) => {
    // Calculate Summary Stats
    const currentWealth = history[history.length - 1]?.totalWealth || 0;
    const totalSpent = history.reduce((sum, h) => sum + h.withdrawn, 0);
    const totalTax = history.reduce((sum, h) => sum + h.taxPaid, 0);

    return (
        <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>

            {/* Summary Dashboard */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Current Net Worth</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>{formatCurrency(currentWealth)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>The Goose 🪿</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Spent</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>{formatCurrency(totalSpent)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {currentWealth > 0 ? `${((totalSpent / currentWealth) * 100).toFixed(1)}% of Range` : 'N/A'}
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Tax Paid</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fb923c' }}>{formatCurrency(totalTax)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {currentWealth > 0 ? `${((totalTax / currentWealth) * 100).toFixed(1)}% of Range` : 'N/A'}
                    </div>
                </div>
            </div>

            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <h4 className="compact-h" style={{ margin: 0 }}>Mission Log Details</h4>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>Year</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>Details</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Tax</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Drawdown</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Wealth</th>
                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>Rebalancing Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 1 &&
                            <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Simulation Initialized.</td></tr>
                        }
                        {[...history].reverse().map((h) => {
                            // Parse Rebalancing Log
                            let rebalancingNodes = <span style={{ opacity: 0.3 }}>-</span>;
                            if (h.rebalancingMoves && Array.isArray(h.rebalancingMoves) && h.rebalancingMoves.length > 0) {
                                rebalancingNodes = (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {h.rebalancingMoves.map((m, idx) => (
                                            <div key={idx} style={{ fontSize: '0.8rem' }}>
                                                <span style={{ color: '#fbbf24', fontWeight: 500 }}>{m.reason}</span>:
                                                <span style={{ color: '#fff', marginLeft: '4px' }}>{formatCurrency(m.amount)}</span>
                                                <span style={{ color: '#94a3b8', marginLeft: '4px', fontSize: '0.75rem' }}>
                                                    (B{m.fromBucketIndex + 1} ➝ B{m.toBucketIndex + 1})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            } else if (typeof h.rebalancingMoves === 'string') {
                                rebalancingNodes = <span style={{ fontSize: '0.8rem' }}>{h.rebalancingMoves}</span>;
                            }

                            return (
                                <tr key={h.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: h.marketEvent ? 'rgba(234, 179, 8, 0.05)' : 'transparent' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, verticalAlign: 'top' }}>{h.year}</td>

                                    {/* Compact Details Column */}
                                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'x 1rem', fontSize: '0.75rem', rowGap: '2px' }}>
                                            <span style={{ color: '#94a3b8' }}>B1 (Cash):</span>
                                            <span style={{ color: h.buckets[0].lastYearReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {h.buckets[0].lastYearReturn !== 0 ? `${(h.buckets[0].lastYearReturn * 100).toFixed(1)}%` : '-'}
                                            </span>

                                            <span style={{ color: '#94a3b8' }}>B2 (Inc):</span>
                                            <span style={{ color: h.buckets[1].lastYearReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {h.buckets[1].lastYearReturn !== 0 ? `${(h.buckets[1].lastYearReturn * 100).toFixed(1)}%` : '-'}
                                            </span>

                                            <span style={{ color: '#94a3b8' }}>B3 (Gro):</span>
                                            <span style={{ color: h.buckets[2].lastYearReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {h.buckets[2].lastYearReturn !== 0 ? `${(h.buckets[2].lastYearReturn * 100).toFixed(1)}%` : '-'}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={{ padding: '0.75rem 1rem', color: '#fb923c', textAlign: 'right', verticalAlign: 'top' }}>
                                        {h.taxPaid > 0 ? formatCurrency(h.taxPaid) : '-'}
                                    </td>

                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', verticalAlign: 'top' }}>
                                        <div>{formatCurrency(h.withdrawn)}</div>
                                        {h.spendingCutApplied && (
                                            <span
                                                title="Inflation Adjustment Skipped: To preserve capital during a downturn, the annual inflation increase was not applied to your withdrawal."
                                                style={{ fontSize: '0.7rem', color: 'var(--color-warning)', border: '1px solid var(--color-warning)', padding: '0 4px', borderRadius: '4px', cursor: 'help' }}
                                            >
                                                CUT ℹ️
                                            </span>
                                        )}
                                    </td>

                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right', verticalAlign: 'top' }}>
                                        {formatCurrency(h.totalWealth)}
                                    </td>

                                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                                        {rebalancingNodes}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MissionLog;
