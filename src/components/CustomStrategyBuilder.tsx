import React, { useState } from 'react';
import type { CustomStrategyConfig, RebalancingParams } from '../types';

interface CustomStrategyBuilderProps {
    initialConfig?: CustomStrategyConfig;
    onSave: (config: CustomStrategyConfig) => void;
    onCancel: () => void;
}

const BASE_STRATEGIES = [
    {
        id: 'RefillBucket1',
        label: 'Safety Wedge (Refill B1)',
        description: 'Prioritizes keeping a safe cash floor. Only sells assets when cash drops below the safety limit.'
    },
    {
        id: 'Tactical',
        label: 'Tactical Flex (Active)',
        description: 'Dynamically adjusts equity exposure based on market valuations and stockpiles cash during bull runs.'
    },
    {
        id: 'GlidePath',
        label: 'Glide Path (Target Date)',
        description: 'Gradually reduces risk as you age. Starts aggressive and becomes conservative near the end of the plan.'
    },
    {
        id: 'AI_Max_Survival',
        label: 'AI Agent (Monte Carlo)',
        description: 'Uses real-time simulations to dynamically adjust allocations. Seeks maximum survival probability.'
    }
];

export const CustomStrategyBuilder: React.FC<CustomStrategyBuilderProps> = ({ initialConfig, onSave, onCancel }) => {
    const [baseStrategy, setBaseStrategy] = useState<CustomStrategyConfig['baseStrategy']>(initialConfig?.baseStrategy || 'GlidePath');
    const [params, setParams] = useState<RebalancingParams>(initialConfig?.params || {
        safetyThresholdYears: 3,
        maxCashBufferMultiplier: 1.5,
        tacticalEquityTargetStart: 0.60,
        tacticalEquityTargetEnd: 0.30,
        gpStartEquity: 0.70,
        gpEndEquity: 0.50,
        gpAggressiveYears: 25,
        gpConservativeYears: 5,
        aiSafeYears: 6,
        aiMaxEquity: 0.9,
        aiMinEquity: 0.1
    });

    const updateParam = (key: keyof RebalancingParams, value: number) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            overflow: 'auto',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            {/* Top Navigation Bar */}
            <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.8)', position: 'sticky', top: 0, zIndex: 10
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2rem' }}>🛠️</span> Custom Strategy Lab
                    </h2>
                    <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '1rem' }}>
                        Design a bespoke algorithm to survive the worst market crashes.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.75rem 1.5rem', background: 'transparent',
                            border: '1px solid #475569', color: '#cbd5e1',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
                            transition: 'all 0.2s hover:bg-slate-800'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave({ baseStrategy, params })}
                        style={{
                            padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                            border: 'none', color: '#0f172a', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                            transition: 'transform 0.1s'
                        }}
                    >
                        Activate Strategy
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, padding: '3rem', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>

                {/* LEFT COLUMN: Strategy Selection */}
                <div style={{ flex: '1 1 400px', minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '1.5rem', borderLeft: '4px solid #38bdf8', paddingLeft: '1rem' }}>
                        Step 1: Choose Base Logic
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {BASE_STRATEGIES.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setBaseStrategy(s.id as any)}
                                style={{
                                    padding: '1.5rem', borderRadius: '12px', border: '1px solid',
                                    borderColor: baseStrategy === s.id ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                                    background: baseStrategy === s.id ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    transform: baseStrategy === s.id ? 'translateX(8px)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ color: baseStrategy === s.id ? '#38bdf8' : 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                                        {s.label}
                                    </span>
                                    {baseStrategy === s.id && <span style={{ color: '#38bdf8' }}>✔️</span>}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                                    {s.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Configuration */}
                <div style={{ flex: '2 1 600px', minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '1.5rem', borderLeft: '4px solid #F59E0B', paddingLeft: '1rem' }}>
                        Step 2: Tune Parameters
                    </h3>

                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* COMMON PARAMETERS */}
                        {(baseStrategy === 'RefillBucket1' || baseStrategy === 'Tactical') && (
                            <div style={{ marginBottom: '3rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Safety Wedge Floor
                                        <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 10px', borderRadius: '6px' }}>
                                            {params.safetyThresholdYears} Years
                                        </span>
                                    </label>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        The minimum amount of cash (Bucket 1) you want to maintain at all times. If it drops below this, we sell other assets to refill it.
                                    </p>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="0.5"
                                    value={params.safetyThresholdYears || 2}
                                    onChange={(e) => updateParam('safetyThresholdYears', parseFloat(e.target.value))}
                                    style={{ width: '100%', height: '8px', accentColor: '#38bdf8', cursor: 'grab' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    <span>1 Year (Risky)</span>
                                    <span>5 Years (Standard)</span>
                                    <span>10 Years (Ultra Safe)</span>
                                </div>
                            </div>
                        )}

                        {/* AI AGENT SPECIFIC */}
                        {baseStrategy === 'AI_Max_Survival' && (
                            <>
                                <div style={{ marginBottom: '3rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            Safety Target (Years of Expenses)
                                            <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 10px', borderRadius: '6px' }}>
                                                {params.aiSafeYears || 6} Years
                                            </span>
                                        </label>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            The AI will try to lock this many years of expenses in Safe buckets (Cash + Income).
                                        </p>
                                    </div>
                                    <input
                                        type="range" min="1" max="10" step="0.5"
                                        value={params.aiSafeYears || 6}
                                        onChange={(e) => updateParam('aiSafeYears', parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '8px', accentColor: '#38bdf8', cursor: 'grab' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', display: 'block' }}>
                                        Global Equity Constraints
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Max Equity</div>
                                            <div style={{ fontSize: '1.5rem', color: '#4ade80', fontWeight: 700 }}>
                                                {((params.aiMaxEquity || 0.9) * 100).toFixed(0)}%
                                            </div>
                                            <input
                                                type="range" min="0.1" max="1" step="0.05"
                                                value={params.aiMaxEquity || 0.9}
                                                onChange={(e) => updateParam('aiMaxEquity', parseFloat(e.target.value))}
                                                style={{ width: '100%', marginTop: '0.5rem', accentColor: '#4ade80' }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '2rem', color: '#64748b' }}>➜</div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Min Equity</div>
                                            <div style={{ fontSize: '1.5rem', color: '#f87171', fontWeight: 700 }}>
                                                {((params.aiMinEquity || 0.1) * 100).toFixed(0)}%
                                            </div>
                                            <input
                                                type="range" min="0" max="0.9" step="0.05"
                                                value={params.aiMinEquity || 0.1}
                                                onChange={(e) => updateParam('aiMinEquity', parseFloat(e.target.value))}
                                                style={{ width: '100%', marginTop: '0.5rem', accentColor: '#f87171' }}
                                            />
                                        </div>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1rem' }}>
                                        Hard limits for the AI. It will never go above Max or below Min equity, regardless of market conditions.
                                    </p>
                                </div>

                                {/* Collapsible Policy Curve */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fcd34d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>⚡ Advanced: Dynamic Equity Policy</span>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>Risk Tiers</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {[
                                            { k: 'lt3', l: 'Crisis (<3 Years)', min: 0, max: 0.5 },
                                            { k: 't3to5', l: 'Defensive (3-5 Years)', min: 0.1, max: 0.7 },
                                            { k: 't5to7', l: 'Balanced (5-7 Years)', min: 0.2, max: 0.8 },
                                            { k: 't7to10', l: 'Growth (7-10 Years)', min: 0.3, max: 1.0 },
                                            { k: 't10to12', l: 'Secure (10-12 Years)', min: 0.3, max: 1.0 },
                                            { k: 't12to15', l: 'Wealthy (12-15 Years)', min: 0.4, max: 1.0 },
                                            { k: 'gt15', l: 'Freedom (15+ Years)', min: 0.5, max: 1.0 }
                                        ].map((tier) => {
                                            const val = (params.aiPolicy as any)?.[tier.k] ??
                                                (tier.k === 'lt3' ? 0.3 : tier.k === 't3to5' ? 0.4 : tier.k === 't5to7' ? 0.5 :
                                                    tier.k === 't7to10' ? 0.6 : tier.k === 't10to12' ? 0.7 : tier.k === 't12to15' ? 0.8 : 0.9);

                                            return (
                                                <div key={tier.k}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem' }}>
                                                        <span style={{ color: '#94a3b8' }}>{tier.l}</span>
                                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{(val * 100).toFixed(0)}% Eq</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={tier.min} max={tier.max} step={0.05}
                                                        value={val}
                                                        onChange={(e) => {
                                                            const newVal = parseFloat(e.target.value);
                                                            const curPolicy = params.aiPolicy || {
                                                                lt3: 0.3, t3to5: 0.4, t5to7: 0.5, t7to10: 0.6,
                                                                t10to12: 0.7, t12to15: 0.8, gt15: 0.9
                                                            };
                                                            updateParam('aiPolicy', { ...curPolicy, [tier.k]: newVal });
                                                        }}
                                                        style={{ width: '100%', accentColor: '#38bdf8' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* TACTICAL SPECIFIC */}
                        {baseStrategy === 'Tactical' && (
                            <>
                                <div style={{ marginBottom: '3rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            Max Cash Hoarding
                                            <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 10px', borderRadius: '6px' }}>
                                                {params.maxCashBufferMultiplier}x Floor
                                            </span>
                                        </label>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            How much excess cash to stockpile before forced investing. Determine when your "War Chest" is full.
                                        </p>
                                    </div>
                                    <input
                                        type="range" min="1.0" max="3.0" step="0.1"
                                        value={params.maxCashBufferMultiplier || 1.5}
                                        onChange={(e) => updateParam('maxCashBufferMultiplier', parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '8px', accentColor: '#38bdf8', cursor: 'grab' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', display: 'block' }}>
                                        Equity Exposure Range (Tactical)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Maximum Equity</div>
                                            <div style={{ fontSize: '1.5rem', color: '#4ade80', fontWeight: 700 }}>
                                                {((params.tacticalEquityTargetStart || 0.6) * 100).toFixed(0)}%
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={params.tacticalEquityTargetStart || 0.6}
                                                onChange={(e) => updateParam('tacticalEquityTargetStart', parseFloat(e.target.value))}
                                                style={{ width: '100%', marginTop: '0.5rem', accentColor: '#4ade80' }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '2rem', color: '#64748b' }}>➜</div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Minimum Equity</div>
                                            <div style={{ fontSize: '1.5rem', color: '#f87171', fontWeight: 700 }}>
                                                {((params.tacticalEquityTargetEnd || 0.3) * 100).toFixed(0)}%
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={params.tacticalEquityTargetEnd || 0.3}
                                                onChange={(e) => updateParam('tacticalEquityTargetEnd', parseFloat(e.target.value))}
                                                style={{ width: '100%', marginTop: '0.5rem', accentColor: '#f87171' }}
                                            />
                                        </div>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1rem' }}>
                                        We will target Max Equity when markets are cheap, and drop to Min Equity when expensive.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* GLIDE PATH SPECIFIC */}
                        {baseStrategy === 'GlidePath' && (
                            <>
                                <div style={{ marginBottom: '3rem' }}>
                                    <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', display: 'block' }}>
                                        Equity Glide Path (Start ➜ End)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Start Equity (Aggressive)</div>
                                            <div style={{ fontSize: '2rem', color: '#38bdf8', fontWeight: 700 }}>
                                                {((params.gpStartEquity || 0.7) * 100).toFixed(0)}%
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={params.gpStartEquity || 0.7}
                                                onChange={(e) => updateParam('gpStartEquity', parseFloat(e.target.value))}
                                                style={{ width: '100%', marginTop: '1rem', accentColor: '#38bdf8' }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '2rem', color: '#64748b' }}>➜</div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>End Equity (Conservative)</div>
                                            <div style={{ fontSize: '2rem', color: '#a78bfa', fontWeight: 700 }}>
                                                {((params.gpEndEquity || 0.5) * 100).toFixed(0)}%
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={params.gpEndEquity || 0.5}
                                                onChange={(e) => updateParam('gpEndEquity', parseFloat(e.target.value))}
                                                style={{ width: '100%', marginTop: '1rem', accentColor: '#a78bfa' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', display: 'block' }}>
                                        Timeline Config (Years Remaining)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                Start De-risking When:
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="number"
                                                    value={params.gpAggressiveYears}
                                                    onChange={(e) => updateParam('gpAggressiveYears', parseInt(e.target.value))}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.3)', border: '1px solid #475569', color: 'white',
                                                        padding: '0.75rem', borderRadius: '8px', fontSize: '1.1rem', width: '100px', fontWeight: 'bold'
                                                    }}
                                                />
                                                <span style={{ color: '#cbd5e1' }}>Years Left</span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                Before this point, we hold max equity ({((params.gpStartEquity || 0.7) * 100).toFixed(0)}%).
                                            </p>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                Reach Max Safety When:
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="number"
                                                    value={params.gpConservativeYears}
                                                    onChange={(e) => updateParam('gpConservativeYears', parseInt(e.target.value))}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.3)', border: '1px solid #475569', color: 'white',
                                                        padding: '0.75rem', borderRadius: '8px', fontSize: '1.1rem', width: '100px', fontWeight: 'bold'
                                                    }}
                                                />
                                                <span style={{ color: '#cbd5e1' }}>Years Left</span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                From this point on, we hold min equity ({((params.gpEndEquity || 0.5) * 100).toFixed(0)}%).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
