import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { YearlyResult } from '../types';

interface BurnDownChartProps {
    history: YearlyResult[];
    survivalYears: number;
    currentYear: number;
}

const BurnDownChart: React.FC<BurnDownChartProps> = ({ history, survivalYears, currentYear }) => {
    // Combine history with projected empty years for the "burn down" feel
    const data = [];
    for (let i = 0; i <= survivalYears; i++) {
        const historyItem = history.find(h => h.year === i);
        data.push({
            year: i,
            wealth: historyItem ? historyItem.totalWealth / 10000000 : null, // Convert to Cr for chart
            projected: null // Could add projection logic later
        });
    }

    return (
        <div className="glass-panel" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1rem' }}>Wealth Trajectory (₹ Cr)</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <XAxis
                            dataKey="year"
                            type="number"
                            domain={[0, survivalYears]}
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 10 }} // Smaller font
                            tickMargin={10}         // More breathing room
                            label={{ value: 'Years', position: 'insideBottomRight', offset: -5, fill: 'white', fontSize: 12 }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 10 }}
                            width={40} // Fixed width to prevent overlap
                            label={{ value: 'Cr', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                            formatter={(value: any) => {
                                const num = Number(value);
                                if (!Number.isFinite(num)) return ['₹---', 'Total Wealth'];
                                return [`₹${num.toFixed(2)} Cr`, 'Total Wealth'];
                            }}
                        />
                        <ReferenceLine x={currentYear} stroke="var(--color-accent)" strokeDasharray="3 3" />

                        {/* Strategy Change Markers */}
                        {history.filter(h => h.strategyChange).map((h, idx) => {
                            const parts = h.strategyChange?.split('➝');
                            const label = parts && parts.length > 1 ? parts[1].trim() : 'Strategy Change';
                            return (
                                <ReferenceLine
                                    key={`strat-${idx}`}
                                    x={h.year}
                                    stroke="#ec4899"
                                    strokeOpacity={0.5}
                                    label={{
                                        value: label,
                                        position: 'insideTopLeft',
                                        fill: '#ec4899',
                                        fontSize: 10,
                                        angle: -90,
                                        offset: 20
                                    }}
                                />
                            );
                        })}

                        <Line
                            type="monotone"
                            dataKey="wealth"
                            stroke="#38bdf8"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BurnDownChart;
