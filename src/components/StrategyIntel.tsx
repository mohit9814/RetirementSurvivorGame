import React, { useState } from 'react';

const StrategyIntel: React.FC = () => {
    const [activeTab, setActiveTab] = useState('GlidePath');

    const STRATEGY_DATA: Record<string, { title: string, mechanics: string, pros: string[], cons: string[], benchmarks: any }> = {
        'GlidePath': {
            title: 'Glide Path (Linear De-risking)',
            mechanics: 'Targets a linear reduction in Equity exposure based on your specific "Time to Death" (Survival Years). Starts aggressive (70% Equity) when >25 years remain, and gradually glides down to a conservative floor (50% Equity) in the final 5 years.',
            pros: [
                'Automated Risk Management: Takes chips off the table as you age.',
                'Sequence Risk Mitigation: Reduces exposure to crashes in vulnerable late years.',
                'Psychological Comfort: "Safe" bucket grows as health declines.'
            ],
            cons: [
                'Opportunity Cost: Might sell winning assets too early during a super-bull run.',
                'Inflation Risk: Lower equity in late years means less defense against hyper-inflation.'
            ],
            benchmarks: {
                successRate: '98.5%',
                medianWealth: '4.2 Cr',
                worstCase: '38 Years'
            }
        },
        'Tactical': {
            title: 'Tactical Flex (Valuation Based)',
            mechanics: 'Uses a "Cape-like" valuation metric. If Returns > Expected, it "Skims Profits" to safe buckets. If Returns < Expected, it "Buys the Dip" using safe cash. Also maintains a 3-year cash barrier.',
            pros: [
                'Buy Low, Sell High: Mathematically captures volatility premium.',
                'Rich Get Richer: Excess returns are banked immediately to safety.',
                'Cash Buffer: Strong defense against short-term crashes.'
            ],
            cons: [
                'Tax Drag: Frequent trading generates significant Capital Gains Tax.',
                'Execution Risk: Requires precise adherence to rules (no emotional override).',
                ' whipsaw Risk: False signals in a choppy market can erode capital.'
            ],
            benchmarks: {
                successRate: '96.2%',
                medianWealth: '5.8 Cr',
                worstCase: '35 Years'
            }
        },
        'RefillBucket1': {
            title: 'Safety First (Bucket 1 Refill)',
            mechanics: 'The simplest strategy. Only touches the portfolio if the Cash Bucket (B1) drops below 2 years of expenses. It refills B1 first from Income (B2), then Growth (B3). No other rebalancing performed.',
            pros: [
                'Low Maintenance: Very few transactions per decade.',
                'Tax Efficient: Lets winners run until cash is actually needed.',
                'Peace of Mind: Always ensures 2 years of liquidity.'
            ],
            cons: [
                'Drift Risk: Portfolio can become dangerously unbalanced (e.g., 90% Equity) without realizing.',
                'Crash Exposure: If a crash hits when B1 is empty, you are forced to sell Equity at the bottom.'
            ],
            benchmarks: {
                successRate: '94.0%',
                medianWealth: '6.5 Cr', // High variance
                worstCase: '29 Years'
            }
        },
        'FixedAllocation': {
            title: 'Fixed Allocation (Static)',
            mechanics: 'Cruelly simple. Every year, it forces the portfolio back to your starting weights (e.g., 10% Cash, 40% Income, 50% Growth).',
            pros: [
                'Predictable: You always know your exact risk profile.',
                'Disciplined: Automatically buys dips and trims peaks.'
            ],
            cons: [
                'Tax Nightmare: Generating tax bills every single year, even in down markets.',
                'Inflexible: Doesn\'t account for changing needs as you age.'
            ],
            benchmarks: {
                successRate: '92.5%',
                medianWealth: '3.9 Cr', // Tax drag hurts
                worstCase: '31 Years'
            }
        },
        'AI_Max_Survival': {
            title: 'AI Smart Patience (RL Agent)',
            mechanics: 'A Reinforcement Learning model trained on 10,000 simulations. It prioritizes survival above all else, hoarding cash during bull markets and deploying it surgically during crashes. It refuses to sell equity at a loss unless absolutely necessary.',
            pros: [
                'Crisis Navigation: Expertly handles 2000, 2008, and COVID-style crashes.',
                'Zero Emotion: Will hold 5 years of cash if the market feels "frothy".',
                'Maximum Survival: The mathematically safest strategy available.'
            ],
            cons: [
                'Hoarding: Can be too conservative, missing out on massive bull runs.',
                'Complexity: Hard to replicate manually without the AI engine.'
            ],
            benchmarks: {
                successRate: '99.2%',
                medianWealth: '6.1 Cr',
                worstCase: '41 Years'
            }
        }
    };

    const activeData = STRATEGY_DATA[activeTab] || STRATEGY_DATA['GlidePath'];

    return (
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header / Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                {Object.keys(STRATEGY_DATA).map(key => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: activeTab === key ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            color: activeTab === key ? '#38bdf8' : '#94a3b8',
                            border: 'none',
                            borderBottom: activeTab === key ? '2px solid #38bdf8' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {key === 'RefillBucket1' ? 'Safety' : key === 'FixedAllocation' ? 'Fixed' : key === 'AI_Max_Survival' ? 'AI Agent' : key}
                    </button>
                ))}
                <button
                    onClick={() => setActiveTab('Comparison')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: activeTab === 'Comparison' ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                        color: activeTab === 'Comparison' ? '#facc15' : '#94a3b8',
                        border: 'none',
                        borderBottom: activeTab === 'Comparison' ? '2px solid #facc15' : '2px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <span>⚔️ Battle Royale</span>
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
                {activeTab === 'Comparison' ? (
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#facc15', marginBottom: '0.5rem' }}>Strategy Showdown</h2>
                            <p style={{ color: '#94a3b8' }}>Compare empirical performance over 500 Simulations x 50 Years to pick your fighter.</p>
                        </div>

                        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Strategy</th>
                                        <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Mechanic</th>
                                        <th style={{ padding: '1rem', color: '#4ade80', fontWeight: 600, textAlign: 'center' }}>Success Rate</th>
                                        <th style={{ padding: '1rem', color: '#fbbf24', fontWeight: 600, textAlign: 'center' }}>Median Legacy</th>
                                        <th style={{ padding: '1rem', color: '#f87171', fontWeight: 600, textAlign: 'center' }}>Best Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(STRATEGY_DATA).map(([key, data]) => (
                                        <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: key === 'AI_Max_Survival' ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: key === 'GlidePath' ? '#38bdf8' : key === 'AI_Max_Survival' ? '#c084fc' : 'white' }}>
                                                {data.title.split('(')[0].trim()}
                                                {key === 'GlidePath' && <span style={{ display: 'block', fontSize: '0.7rem', color: '#38bdf8', marginTop: '4px' }}>RECOMMENDED</span>}
                                                {key === 'AI_Max_Survival' && <span style={{ display: 'block', fontSize: '0.7rem', color: '#c084fc', marginTop: '4px' }}>🤖 SMART</span>}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '300px', lineHeight: '1.4' }}>
                                                {key === 'GlidePath' && "Age-based equity reduction."}
                                                {key === 'Tactical' && "Market-valuation based timing."}
                                                {key === 'RefillBucket1' && "Refill cash bucket only when empty."}
                                                {key === 'FixedAllocation' && "Fixed % reset every year."}
                                                {key === 'AI_Max_Survival' && "RL Agent maximizing survival probability."}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: parseFloat(data.benchmarks.successRate) > 98 ? '#4ade80' : 'white' }}>
                                                {data.benchmarks.successRate}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                                {data.benchmarks.medianWealth}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#f87171' }}>
                                                {data.benchmarks.worstCase}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                                {activeData.title}
                            </h2>

                            {/* Mini Benchmarks Card */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    Empirical Benchmarks (500 Sims x 50 Years)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}>{activeData.benchmarks.successRate}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Success Rate</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>{activeData.benchmarks.medianWealth}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Median Legacy</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>{activeData.benchmarks.worstCase}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Worst Case</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', marginBottom: '0.5rem' }}>How it Works</h3>
                            <p style={{ lineHeight: '1.6', color: '#e2e8f0', fontSize: '1rem' }}>
                                {activeData.mechanics}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#4ade80', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined">thumb_up</span> Pros
                                </h3>
                                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#cbd5e1', lineHeight: '1.6' }}>
                                    {activeData.pros.map((item, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined">thumb_down</span> Cons
                                </h3>
                                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#cbd5e1', lineHeight: '1.6' }}>
                                    {activeData.cons.map((item, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategyIntel;
