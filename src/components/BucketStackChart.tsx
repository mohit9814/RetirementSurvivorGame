import React from 'react';
import { ComposedChart, Area, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { YearlyResult } from '../types';
import { formatCurrency } from '../utils/currency';

interface BucketStackChartProps {
    history: YearlyResult[];
    survivalYears: number;
    currentYear: number;
    mode?: 'absolute' | 'percent';
}

const BucketStackChart: React.FC<BucketStackChartProps> = ({ history, survivalYears, currentYear, mode = 'absolute' }) => {
    // Determine the max year to plot (Configured vs Actual Progress)
    const maxYear = Math.max(survivalYears, currentYear, history.length > 0 ? history[history.length - 1].year : 0);

    // Transform history for stack chart
    const data: any[] = []; // Cast to any[] as requested
    for (let i = 0; i <= maxYear; i++) {
        // Loose comparison for year safety, though strict should work
        const historyItem = history.find(h => h.year == i);

        if (historyItem) {
            const hasMoves = historyItem.rebalancingMoves && historyItem.rebalancingMoves.length > 0;
            const totalRaw = historyItem.totalWealth;
            const b1Raw = historyItem.buckets[0].balance;
            const b2Raw = historyItem.buckets[1].balance;
            const b3Raw = historyItem.buckets[2].balance;

            // Prepare values based on mode
            let b1Val, b2Val, b3Val, totalVal;

            if (mode === 'percent') {
                // Normalize to 0-100 scale (easier for stacking than 0-1)
                const safeTotal = totalRaw > 0 ? totalRaw : 1;
                b1Val = (b1Raw / safeTotal) * 100;
                b2Val = (b2Raw / safeTotal) * 100;
                b3Val = (b3Raw / safeTotal) * 100;
                totalVal = 100;
            } else {
                // Absolute values in Crores
                b1Val = b1Raw / 10000000;
                b2Val = b2Raw / 10000000;
                b3Val = b3Raw / 10000000;
                totalVal = totalRaw / 10000000;
            }

            data.push({
                year: i,
                B1: b1Val,
                B2: b2Val,
                B3: b3Val,
                total: totalVal, // metadata for tooltip if needed
                realTotal: totalRaw, // keep real total
                // Hide events in percent mode to avoid visual clutter
                event: (hasMoves && mode === 'absolute') ? (totalVal) * 1.05 : null,
                moves: historyItem.rebalancingMoves
            });
        }
        // No else block needed; missing data means gaps in line/area which is fine, 
        // or Recharts connects them. Given we have continuous history, this is fine.
    }

    const renderEventShape = (props: any) => {
        const { cx, cy, payload } = props;
        if (!payload.event) return null;
        return (
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#fbbf24" fontSize="16">
                🧞‍♂️
            </text>
        );
    };

    const toPercent = (val: number) => `${val.toFixed(0)}%`;

    return (
        <div className="glass-panel" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1rem' }}>
                {mode === 'percent' ? 'Asset Allocation (%)' : 'Bucket Composition (₹ Cr)'}
            </h3>
            <div style={{ flex: 1, minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                    // stackOffset="none" is default, we manually stacked via data normalize
                    >
                        <defs>
                            <linearGradient id="colorB1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorB2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorB3" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="year"
                            type="number"
                            domain={[0, maxYear]}
                            stroke="rgba(255,255,255,0.5)"
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tickFormatter={mode === 'percent' ? toPercent : undefined}
                            domain={mode === 'percent' ? [0, 100] : ['auto', 'auto']}
                            label={{
                                value: mode === 'percent' ? '%' : 'Cr',
                                angle: -90,
                                position: 'insideLeft',
                                fill: 'white'
                            }}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const total = data.realTotal / 10000000;

                                    return (
                                        <div style={{
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                            minWidth: '200px'
                                        }}>
                                            {/* Header */}
                                            <div style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                                                <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.9rem' }}>Year {label}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Wealth: ₹{total.toFixed(2)} Cr</div>
                                            </div>

                                            {/* Buckets */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                                {[
                                                    { name: 'Growth (B3)', val: data.B3, color: '#d946ef' },
                                                    { name: 'Income (B2)', val: data.B2, color: '#818cf8' },
                                                    { name: 'Cash (B1)', val: data.B1, color: '#38bdf8' }
                                                ].map(item => (
                                                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                                                            <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                                                        </div>
                                                        <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                                                            {mode === 'percent' ? `${item.val.toFixed(1)}%` : `₹${item.val.toFixed(2)} Cr`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Rebalancing Moves */}
                                            {data.moves && data.moves.length > 0 && (
                                                <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '4px' }}>
                                                    <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        🧞‍♂️ AI Rebalancing
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        {data.moves.map((m: any, idx: number) => {
                                                            const buckets = ['Cash', 'Income', 'Growth'];
                                                            const from = buckets[m.fromBucketIndex] || `B${m.fromBucketIndex + 1}`;
                                                            const to = buckets[m.toBucketIndex] || `B${m.toBucketIndex + 1}`;
                                                            return (
                                                                <div key={idx} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                    • {from} ➝ {to}: {formatCurrency(m.amount)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine x={currentYear} stroke="var(--color-accent)" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="B3"
                            stackId="1"
                            stroke="#d946ef"
                            fill="url(#colorB3)"
                            name="B3"
                        />
                        <Area
                            type="monotone"
                            dataKey="B2"
                            stackId="1"
                            stroke="#818cf8"
                            fill="url(#colorB2)"
                            name="B2"
                        />
                        <Area
                            type="monotone"
                            dataKey="B1"
                            stackId="1"
                            stroke="#38bdf8"
                            fill="url(#colorB1)"
                            name="B1"
                        />
                        <Scatter
                            dataKey="event"
                            name="Genie Event"
                            shape={renderEventShape as any}
                            legendType="none"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BucketStackChart;
