
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Brush, CartesianGrid } from 'recharts';
import type { GameState } from '../types';

interface ComparisonChartProps {
    gameState: GameState;
}

const COLORS = [
    '#ffffff', // Active (White)
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#60a5fa', // Blue
    '#f472b6', // Pink
    '#a78bfa', // Purple
];

const STRATEGY_LABELS: Record<string, string> = {
    'RefillBucket1': 'Bucket 1 Refill',
    'Tactical': 'Tactical Flex',
    'GlidePath': 'Glide Path',
    'FixedAllocation': 'Fixed Alloc',
    'AI_Max_Survival': 'AI Max Survival',
    'None': 'No Rebalancing'
};

const ComparisonChart: React.FC<ComparisonChartProps> = ({ gameState }) => {
    const [useLogScale, setUseLogScale] = useState(false);

    // Merge history from Main + Shadows
    const data: any[] = [];

    // We utilize the longest history available (usually Main, but shadows might die early)
    // Actually, shadows stop updating history when dead. So we use the max year from main state.
    const maxYear = gameState.currentYear;

    for (let i = 0; i <= maxYear; i++) {
        const h = gameState.history[i];
        if (!h) continue; // Should exist for main

        const yearData: any = { year: h.year };

        // Active Strategy
        yearData[gameState.config.rebalancingStrategy] = h.totalWealth / 10000000; // Cr

        // Shadow Strategies
        if (gameState.shadowStrategies) {
            Object.entries(gameState.shadowStrategies).forEach(([stratName, shadowState]) => {
                const shadowH = shadowState.history[i];
                if (shadowH) {
                    yearData[stratName] = shadowH.totalWealth / 10000000;
                } else if (shadowState.isGameOver) {
                    // If dead, wealth is 0
                    yearData[stratName] = 0;
                }
            });
        }
        data.push(yearData);
    }

    const activeStrat = gameState.config.rebalancingStrategy;
    const allStrats = [activeStrat, ...Object.keys(gameState.shadowStrategies || {})];

    const handleDownload = () => {
        // CSV Header
        const headers = ['Year', activeStrat, ...Object.keys(gameState.shadowStrategies || {})].map(s => STRATEGY_LABELS[s] || s).join(',');

        // CSV Rows
        const rows = data.map(row => {
            const vals = [
                row.year,
                row[activeStrat]?.toFixed(2) || '0',
                ...Object.keys(gameState.shadowStrategies || {}).map(k => row[k]?.toFixed(2) || '0')
            ];
            return vals.join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `god_mode_data_${gameState.sessionId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="glass-panel" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                    God Mode: Strategy Comparison (Wealth in ₹ Cr)
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: useLogScale ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)' }}
                        onClick={() => setUseLogScale(!useLogScale)}
                    >
                        {useLogScale ? 'Log Scale' : 'Linear Scale'}
                    </button>
                    <button
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={handleDownload}
                    >
                        ⬇ CSV
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="year" stroke="#94a3b8" />
                        <YAxis
                            stroke="#94a3b8"
                            scale={useLogScale ? 'log' : 'auto'}
                            domain={useLogScale ? ['auto', 'auto'] : [0, 'auto']}
                            tickFormatter={(val) => `₹${val.toFixed(0)}Cr`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                            formatter={(val: any, name: any) => [`₹${Number(val).toFixed(2)} Cr`, STRATEGY_LABELS[name] || name]}
                            labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <Brush
                            dataKey="year"
                            height={30}
                            stroke="#8884d8"
                            fill="#1e293b"
                            tickFormatter={(tick) => `${tick}`}
                        />

                        {allStrats.map((strat, idx) => (
                            <Line
                                key={strat}
                                type="monotone"
                                dataKey={strat}
                                name={strat}
                                stroke={strat === activeStrat ? '#fff' : COLORS[idx % COLORS.length]}
                                strokeWidth={strat === activeStrat ? 3 : 2}
                                dot={false}
                                strokeDasharray={strat === activeStrat ? undefined : '5 5'}
                                activeDot={{ r: 6 }}
                                isAnimationActive={false} // Disable animation for smoother zooming
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ComparisonChart;
