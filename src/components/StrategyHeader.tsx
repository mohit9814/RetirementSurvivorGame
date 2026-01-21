
import React, { useState } from 'react';
import type { GameConfig } from '../types';

interface StrategyHeaderProps {
    currentStrategy: GameConfig['rebalancingStrategy'];
    onStrategyChange: (strategy: GameConfig['rebalancingStrategy']) => void;
    disabled?: boolean;
}

import { CustomStrategyBuilder } from './CustomStrategyBuilder';

const STRATEGIES: Record<string, { label: string, desc: string, shortDesc: string }> = {
    'None': {
        label: 'Do Nothing (Harvest Only)',
        desc: 'Never rebalances. Withdraws from Cash -> Income -> Equity. Best for maximizing bull runs, but highest risk of ruin if a crash hits early.',
        shortDesc: 'Pure Harvest'
    },
    'RefillBucket1': {
        label: 'Refill Bucket 1 (Safety First)',
        desc: 'Only sells assets if Cash (Bucket 1) drops below 2 years of expenses. Ensures short-term safety without over-trading.',
        shortDesc: 'Safety Wedge'
    },
    'Tactical': {
        label: 'Tactical Flex (Market Timing)',
        desc: 'Tries to buy low and sell high based on thresholds. High complexity and tax cost. Often underperforms simple strategies due to friction.',
        shortDesc: 'Active Trading'
    },
    'GlidePath': {
        label: 'Glide Path (Target Date)',
        desc: 'Gradually reduces Equity exposure as you age (from 90% to 50%). Good balance of early growth and late safety.',
        shortDesc: 'Age De-risking'
    },
    'FixedAllocation': {
        label: 'Fixed Allocation (Rebalance)',
        desc: 'Forces the portfolio back to a fixed split (e.g., 10/30/60) every year. High tax cost due to constant selling of winners.',
        shortDesc: 'Fixed Split'
    },
    'AI_Max_Survival': {
        label: 'AI Smart Patience',
        desc: 'Uses Monte Carlo simulations to find the safest path. Can "Do Nothing" if safe, or switch gears in a crisis. Tuned to avoid unnecessary taxes.',
        shortDesc: 'AI Optimizer'
    },
    'Custom': {
        label: 'Custom Strategy',
        desc: 'Your rules, your outcomes. Tweak base parameters to find the perfect edge.',
        shortDesc: 'Custom Rules'
    }
};

interface StrategyHeaderProps {
    currentStrategy: GameConfig['rebalancingStrategy'];
    customStrategyConfig?: GameConfig['customStrategy']; // Add this prop
    onStrategyChange: (strategy: GameConfig['rebalancingStrategy'], customConfig?: GameConfig['customStrategy']) => void; // Update signature
    disabled?: boolean;
}

export const StrategyHeader: React.FC<StrategyHeaderProps> = ({ currentStrategy, customStrategyConfig, onStrategyChange, disabled }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);

    const info = STRATEGIES[currentStrategy] || { label: currentStrategy, desc: 'Custom Strategy', shortDesc: 'Custom' };

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Label */}
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Strategy
            </span>

            {/* Selector Trigger */}
            <div
                onClick={() => !disabled && setShowMenu(!showMenu)}
                style={{
                    cursor: disabled ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontWeight: 600, color: '#f8fafc',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                <span className="strategy-label-text">{info.label}</span>
                {!disabled && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>▼</span>}
            </div>

            {/* Info / Edit Icon */}
            {currentStrategy === 'Custom' ? (
                <div
                    onClick={() => onStrategyChange('Custom', customStrategyConfig)}
                    // Note: In App.tsx we will detect if onStrategyChange is called with 'Custom' to open the builder
                    // Actually, let's keep it simple. If click gear, just trigger the parent.
                    // But we don't have a separate prop yet.
                    // Let's rely on the parent checking if 'Custom' is selected to show the builder?
                    // No, that's annoying effectively. 
                    // Let's use the onStrategyChange callback. If the user clicks the gear, 
                    // we re-select 'Custom', which is benign.
                    // BUT we want to force open the editor.
                    style={{
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.8rem'
                    }}
                >
                    ⚙️
                </div>
            ) : (
                <div
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    style={{
                        cursor: 'help',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold'
                    }}
                >
                    i
                </div>
            )}


            {/* Dropdown Menu */}
            {/* Note: This might still be clipped if inside transform, but it's less critical than the full screen modal. 
                Ideally we lift this too, but let's fix the modal first. 
                Actually, for the dropdown to work inside transform, we need Portal or fixed pos workaround.
                Let's leave it for now, user complained about "Custom Strategy Popup" not menu.
            */}
            {showMenu && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                    <div style={{
                        position: 'absolute', top: '120%', left: 0,
                        background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        zIndex: 100, minWidth: '240px', overflow: 'hidden'
                    }}>
                        {Object.entries(STRATEGIES).map(([key, strat]) => (
                            <div
                                key={key}
                                onClick={() => {
                                    onStrategyChange(key as any);
                                    setShowMenu(false);
                                }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: currentStrategy === key ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = currentStrategy === key ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}
                            >
                                <div style={{ color: currentStrategy === key ? '#38bdf8' : '#e2e8f0', fontWeight: 500 }}>{strat.label}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{strat.shortDesc}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Info Tooltip */}
            {showInfo && (
                <div style={{
                    position: 'absolute', top: '120%', left: '50%', transform: 'translateX(-50%)',
                    background: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
                    padding: '0.75rem', width: '280px', zIndex: 110,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none'
                }}>
                    <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.25rem' }}>{info.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>{info.desc}</div>
                </div>
            )}
        </div>
    );
};
