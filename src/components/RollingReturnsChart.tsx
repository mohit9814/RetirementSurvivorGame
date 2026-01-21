import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { YearlyResult } from '../types';

interface RollingReturnsChartProps {
    history: YearlyResult[];
}

export const RollingReturnsChart: React.FC<RollingReturnsChartProps> = ({ history }) => {
    // Need at least 2 points to calculate any return
    if (!history || history.length < 2) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <p>Not enough data for rolling returns (Need 2+ years)</p>
            </div>
        );
    }

    // Prepare Data
    // We calculate "Portfolio Return" based on Total Wealth Change + Withdrawals
    // Simple Formula: (EndWealth + Withdrawn) / StartWealth - 1
    // Better: Use the stored 'portfolioReturn' field from YearlyResult if available/reliable. 
    // The history object has `portfolioReturn` which is the weighted average of bucket returns.
    // Let's use that as the "Market Performance of Portfolio" (ignoring cashflows like widthdrawals/infusions).

    const data = history.map((entry, index) => {
        if (index === 0) return null; // Skip year 0

        // Calculate Rolling Returns
        // 1Y Rolling: Just this year's return
        const r1y = entry.portfolioReturn * 100;

        // 3Y Rolling (CAGR)
        let r3y = null;
        if (index >= 3) {
            // Product of (1+r) for last 3 years
            let compound = 1;
            for (let i = 0; i < 3; i++) {
                compound *= (1 + history[index - i].portfolioReturn);
            }
            r3y = (Math.pow(compound, 1 / 3) - 1) * 100;
        }

        // 5Y Rolling (CAGR)
        let r5y = null;
        if (index >= 5) {
            let compound = 1;
            for (let i = 0; i < 5; i++) {
                compound *= (1 + history[index - i].portfolioReturn);
            }
            r5y = (Math.pow(compound, 1 / 5) - 1) * 100;
        }

        return {
            year: entry.year,
            '1Y': parseFloat(r1y.toFixed(2)),
            '3Y': r3y ? parseFloat(r3y.toFixed(2)) : null,
            '5Y': r5y ? parseFloat(r5y.toFixed(2)) : null,
        };
    }).filter(x => x !== null);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data as any} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="year"
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `${val}%`}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            color: '#f8fafc',
                            borderRadius: '8px'
                        }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                    />
                    <Legend iconType="circle" />
                    <Line
                        type="monotone"
                        dataKey="1Y"
                        stroke="#94a3b8"
                        strokeWidth={1}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="1Y Rolling"
                        opacity={0.5}
                    />
                    <Line
                        type="monotone"
                        dataKey="3Y"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="3Y CAGR"
                    />
                    <Line
                        type="monotone"
                        dataKey="5Y"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="5Y CAGR"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
