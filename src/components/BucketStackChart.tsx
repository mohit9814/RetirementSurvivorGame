import React from 'react';
import { ComposedChart, Area, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { YearlyResult } from '../types';

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
    const data = [];
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
                            contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', fontSize: '0.75rem' }}
                            formatter={(value: any, name: string, props: any) => {
                                if (name === 'event') return null;
                                const num = Number(value);
                                if (!Number.isFinite(num)) return ['---', name];

                                const label = name === 'B1' ? 'Cash (B1)' : name === 'B2' ? 'Income (B2)' : 'Growth (B3)';

                                if (mode === 'percent') {
                                    return [`${num.toFixed(1)}%`, label];
                                }
                                return [`₹${num.toFixed(2)} Cr`, label];
                            }}
                            labelFormatter={(label) => {
                                const item = data.find(d => d.year === label);
                                let suffix = '';
                                if (item && item.moves && item.moves.length > 0) {
                                    suffix = `\n(🧞‍♂️ ${item.moves.length} Rebalancing Move${item.moves.length > 1 ? 's' : ''})`;
                                }
                                return `Year ${label}${suffix}`;
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
                            shape={renderEventShape}
                            legendType="none"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BucketStackChart;
