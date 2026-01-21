import React, { useState } from 'react';
import type { GameState } from '../types';
import { formatCurrency } from '../utils/currency';
import { RollingReturnsChart } from './RollingReturnsChart';

interface StrategyIntelProps {
    gameState: GameState;
}

const StrategyIntel: React.FC<StrategyIntelProps> = ({ gameState }) => {
    const [activeTab, setActiveTab] = useState('Alpha');
    const [benchmark, setBenchmark] = useState('FixedAllocation');

    const STRATEGY_DATA: Record<string, { title: string, mechanics: string, pros: string[], cons: string[], benchmarks: any }> = {
        'GlidePath': {
            title: 'Glide Path (Linear De-risking)',
            mechanics: 'Targets a linear reduction in Equity exposure based on your specific "Time to Death" (Survival Years). Starts aggressive (70% Equity) when >25 years remain, and gradually glides down to a conservative floor (50% Equity) in the final 5 years.',
            pros: ['Automated Risk Management', 'Sequence Risk Mitigation', 'Psychological Comfort'],
            cons: ['Opportunity Cost during Bull Runs', 'Inflation Risk via Lower Equity'],
            benchmarks: { survivalDuration: '39 Years', legacyFunds: '₹4.2 Cr', label: 'Balanced' }
        },
        'Tactical': {
            title: 'Tactical Flex (Valuation Based)',
            mechanics: 'Uses a "Cape-like" valuation metric. If Returns > Expected, it "Skims Profits" to safe buckets. If Returns < Expected, it "Buys the Dip" using safe cash. Also maintains a 3-year cash barrier.',
            pros: ['Buy Low, Sell High', 'Rich Get Richer (Skim Profits)', 'Cash Buffer Defense'],
            cons: ['Tax Drag (Capital Gains)', 'Execution Risk (Emotions)', 'Whipsaw Risk'],
            benchmarks: { survivalDuration: '38 Years', legacyFunds: '₹5.8 Cr', label: 'High Growth' }
        },
        'RefillBucket1': {
            title: 'Safety First (Bucket 1 Refill)',
            mechanics: 'The simplest strategy. Only touches the portfolio if the Cash Bucket (B1) drops below 2 years of expenses. It refills B1 first from Income (B2), then Growth (B3). No other rebalancing performed.',
            pros: ['Low Maintenance', 'Tax Efficient', 'Peace of Mind'],
            cons: ['Drift Risk (Unnoticed Aggression)', 'Crash Exposure (Selling at Bottom)'],
            benchmarks: { survivalDuration: '35 Years', legacyFunds: '₹6.5 Cr', label: 'Conservative' }
        },
        'FixedAllocation': {
            title: 'Fixed Allocation (Static)',
            mechanics: 'Cruelly simple. Every year, it forces the portfolio back to your starting weights (e.g., 10% Cash, 40% Income, 50% Growth).',
            pros: ['Predictable Risk Profile', 'Disciplined Rebalancing'],
            cons: ['Tax Nightmare', 'Inflexible to Aging'],
            benchmarks: { survivalDuration: '31 Years', legacyFunds: '₹3.9 Cr', label: 'Risky' }
        },
        'AI_Max_Survival': {
            title: 'AI Smart Patience (RL Agent)',
            mechanics: 'A Reinforcement Learning model trained on 10,000 simulations. It prioritizes survival above all else, hoarding cash during bull markets and deploying it surgically during crashes. It refuses to sell equity at a loss unless absolutely necessary.',
            pros: ['Crisis Navigation', 'Zero Emotion', 'Maximum Survival'],
            cons: ['Hoarding (Too Conservative)', 'Complexity'],
            benchmarks: { survivalDuration: '40+ Years', legacyFunds: '₹6.1 Cr', label: 'Optimal' }
        }
    };

    // Calculate Alpha
    const getAlphaData = () => {
        if (!gameState.shadowStrategies || !gameState.shadowStrategies[benchmark]) return null;

        const myWealth = gameState.buckets.reduce((s, b) => s + b.balance, 0);
        const benchState = gameState.shadowStrategies[benchmark];
        const benchWealth = benchState.buckets.reduce((s, b) => s + b.balance, 0);

        const myReturn = (myWealth / gameState.config.initialCorpus) - 1;
        const benchReturn = (benchWealth / gameState.config.initialCorpus) - 1;

        const alphaAbs = myWealth - benchWealth;
        const alphaPct = (myReturn - benchReturn) * 100; // Simplified Alpha

        return { myWealth, benchWealth, alphaAbs, alphaPct, benchState };
    };

    const alphaData = getAlphaData();

    return (
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header / Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('Alpha')}
                    style={{
                        padding: '1rem', flex: 1, minWidth: '120px',
                        background: activeTab === 'Alpha' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        color: activeTab === 'Alpha' ? '#34d399' : '#94a3b8',
                        borderBottom: activeTab === 'Alpha' ? '2px solid #34d399' : '2px solid transparent',
                        cursor: 'pointer', fontWeight: 700
                    }}
                >
                    📈 Alpha & Returns
                </button>
                {Object.keys(STRATEGY_DATA).map(key => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            padding: '1rem', flex: 1,
                            background: activeTab === key ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            color: activeTab === key ? '#38bdf8' : '#94a3b8',
                            border: 'none',
                            borderBottom: activeTab === key ? '2px solid #38bdf8' : '2px solid transparent',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                        }}
                    >
                        {key === 'RefillBucket1' ? 'Safety' : key === 'FixedAllocation' ? 'Fixed' : key === 'AI_Max_Survival' ? 'AI' : key}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>

                {activeTab === 'Alpha' ? (
                    <div style={{ maxWidth: '900px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* 1. Alpha Dashboard */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>Performance vs Benchmark</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Compare against:</span>
                                    <select
                                        value={benchmark}
                                        onChange={(e) => setBenchmark(e.target.value)}
                                        style={{ background: '#1e293b', border: '1px solid #475569', color: 'white', padding: '4px 8px', borderRadius: '4px' }}
                                    >
                                        <option value="FixedAllocation">Fixed Allocation</option>
                                        <option value="RefillBucket1">Safety Refill</option>
                                        <option value="GlidePath">Glide Path</option>
                                        <option value="AI_Max_Survival">AI Agent</option>
                                    </select>
                                </div>
                            </div>

                            {alphaData ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>My Wealth</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{formatCurrency(alphaData.myWealth).split('.')[0]}</div>
                                    </div>
                                    <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>{benchmark} Wealth</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#cbd5e1' }}>{formatCurrency(alphaData.benchWealth).split('.')[0]}</div>
                                    </div>
                                    <div className="stat-card" style={{ background: alphaData.alphaAbs >= 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', padding: '1rem', borderRadius: '8px', border: alphaData.alphaAbs >= 0 ? '1px solid #059669' : '1px solid #b91c1c' }}>
                                        <div style={{ color: alphaData.alphaAbs >= 0 ? '#34d399' : '#f87171', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Alpha Generated</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: alphaData.alphaAbs >= 0 ? '#34d399' : '#f87171' }}>
                                            {alphaData.alphaAbs >= 0 ? '+' : ''}{formatCurrency(alphaData.alphaAbs).split('.')[0]}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    Simulation needs to advance to calculate data.
                                </div>
                            )}
                        </div>

                        {/* 2. Rolling Returns Chart */}
                        <div style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 1rem', color: '#f8fafc', fontSize: '1.25rem' }}>Rolling Portfolio Returns (CAGR)</h3>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
                                <RollingReturnsChart history={gameState.history} />
                            </div>
                        </div>

                    </div>
                ) : (
                    // Standard Doc Content for other tabs
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {STRATEGY_DATA[activeTab] && (
                            <>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem' }}>{STRATEGY_DATA[activeTab].title}</h2>

                                {/* Benchmarks Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Survival Duration</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fcd34d' }}>{STRATEGY_DATA[activeTab].benchmarks.survivalDuration}</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Legacy Funds</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{STRATEGY_DATA[activeTab].benchmarks.legacyFunds}</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', marginBottom: '0.5rem' }}>How it Works</h3>
                                    <p style={{ lineHeight: '1.6', color: '#e2e8f0', fontSize: '1rem' }}>{STRATEGY_DATA[activeTab].mechanics}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', color: '#4ade80', marginBottom: '1rem' }}>👍 Pros</h3>
                                        <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1' }}>{STRATEGY_DATA[activeTab].pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', color: '#f87171', marginBottom: '1rem' }}>👎 Cons</h3>
                                        <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1' }}>{STRATEGY_DATA[activeTab].cons.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategyIntel;
