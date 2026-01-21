import React, { useState } from 'react';
import type { GameConfig, BucketConfig } from '../types';

interface ConfigModalProps {
    config: GameConfig;
    isOpen: boolean;
    onClose: () => void;
    onSave: (newConfig: GameConfig) => void;
    onShowLeaderboard?: () => void;
    onExportData?: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ config, isOpen, onClose, onSave, onShowLeaderboard, onExportData }) => {
    const [localConfig, setLocalConfig] = useState<GameConfig>(config);

    // Sync state with prop ONLY when modal opens
    const prevIsOpenRef = React.useRef(false);
    React.useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setLocalConfig(config);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, config]);

    if (!isOpen) return null;

    const handleBucketChange = (index: number, field: keyof BucketConfig, value: number) => {
        const newBuckets = [...localConfig.bucketConfigs];
        newBuckets[index] = { ...newBuckets[index], [field]: value };
        setLocalConfig({ ...localConfig, bucketConfigs: newBuckets });
    };

    const handleInflationChange = (val: number) => {
        setLocalConfig({ ...localConfig, inflationRate: val });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Configuration</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </h2>

                {/* Quick Actions (Moved from Header) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {onShowLeaderboard && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => { onShowLeaderboard(); onClose(); }}
                            style={{ padding: '0.75rem', justifyContent: 'center' }}
                        >
                            🏆 Leaderboard
                        </button>
                    )}
                    {onExportData && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => { onExportData(); onClose(); }}
                            style={{ padding: '0.75rem', justifyContent: 'center' }}
                        >
                            ⬇ Export Data
                        </button>
                    )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Inflation Rate (Annual)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="range" min="0" max="0.15" step="0.005"
                            value={localConfig.inflationRate}
                            onChange={e => handleInflationChange(parseFloat(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ minWidth: '60px', textAlign: 'right' }}>{(localConfig.inflationRate * 100).toFixed(1)}%</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Target Mission Duration (Years)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="range" min="10" max="200" step="1"
                            value={localConfig.survivalYears}
                            onChange={e => setLocalConfig({ ...localConfig, survivalYears: parseInt(e.target.value) })}
                            style={{ flex: 1 }}
                        />
                        <span style={{ minWidth: '60px', textAlign: 'right' }}>{localConfig.survivalYears} Yrs</span>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <input
                        type="checkbox"
                        id="taxToggle"
                        checked={localConfig.enableTaxation ?? true}
                        onChange={e => setLocalConfig({ ...localConfig, enableTaxation: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="taxToggle" style={{ fontSize: '1rem', cursor: 'pointer' }}>
                        Enable Taxation Simulation
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                            Simulates New Regime Income Tax (Bucket 1 & 2) and LTCG (Bucket 3, &gt;1.25L)
                        </div>
                    </label>
                </div>

                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <input
                        type="checkbox"
                        id="notifyToggle"
                        checked={localConfig.showInterventionPopups ?? true}
                        onChange={e => setLocalConfig({ ...localConfig, showInterventionPopups: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="notifyToggle" style={{ fontSize: '1rem', cursor: 'pointer' }}>
                        Show Strategy Notifications
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                            Show popup alerts when the strategy rebalances your portfolio.
                        </div>
                    </label>
                </div>

                <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--color-accent)' }}>Auto-Rebalancing Strategy</label>
                    <select
                        value={localConfig.rebalancingStrategy || 'None'}
                        onChange={(e) => setLocalConfig({ ...localConfig, rebalancingStrategy: e.target.value as any })}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white'
                        }}
                    >
                        <option value="None">None (Manual Transfers)</option>
                        <option value="RefillBucket1">Safety First (Refill Bucket 1)</option>
                        <option value="FixedAllocation">Fixed Allocation (Reset Annually)</option>
                        <option value="GlidePath">Declining Glide Path (90% {"->"} 50%)</option>
                        <option value="Custom">Custom Strategy</option>
                        <option value="Tactical">Tactical (Safety + Profit Taking)</option>
                        <option value="AI_Max_Survival">AI Self-Adjusting (Survival Optimization)</option>
                    </select>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        {localConfig.rebalancingStrategy === 'RefillBucket1' && "Automatically moves funds from Bucket 2/3 to keep 2 years of expenses in Bucket 1."}
                        {localConfig.rebalancingStrategy === 'FixedAllocation' && "Resets all buckets to their initial allocation % every year."}
                        {(!localConfig.rebalancingStrategy || localConfig.rebalancingStrategy === 'None') && "No automatic moves. You control the transfers."}
                        {localConfig.rebalancingStrategy === 'AI_Max_Survival' && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(124, 58, 237, 0.2)', borderRadius: '4px', border: '1px solid rgba(124, 58, 237, 0.5)' }}>
                                <div style={{ fontSize: '0.8rem', color: '#c4b5fd' }}>
                                    <strong>🤖 AI Learning Engine</strong><br />
                                    Runs hundreds of Monte Carlo simulations before every year to find the optimal allocation that maximizes your survival probability.<br />
                                    <em>Adapts to market conditions instantly.</em>
                                </div>
                            </div>
                        )}
                        {localConfig.rebalancingStrategy === 'Custom' && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    Use the Strategy Builder (Gear Icon) to configure this.
                                </div>
                            </div>
                        )}
                        {/* 
                         Legacy Tactical Config Removed (Properties not in GameConfig) 
                         TODO: Check if we need to add tacticalCashBufferYears to GameConfig or use overrides.
                        */}
                        {localConfig.rebalancingStrategy === 'GlidePath' && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>
                                    <strong>Winning Strategy (Optimization Result)</strong><br />
                                    Starts at 90% Equity (Aggressive) to maximize early growth.<br />
                                    Reduces Equity by 0.8% per year until it hits 50% at Year 50.<br />
                                    <em>This "front-loads" compounding while de-risking your massive corpus later.</em>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <h3>Buckets</h3>
                {localConfig.bucketConfigs.map((bucket, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-accent)' }}>{bucket.name}</h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Allocation</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number" step="1"
                                        value={(bucket.allocation * 100).toFixed(0)}
                                        onChange={e => handleBucketChange(i, 'allocation', parseFloat(e.target.value) / 100)}
                                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.25rem' }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Exp. Return</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number" step="0.1"
                                        value={(bucket.expectedReturn * 100).toFixed(1)}
                                        onChange={e => handleBucketChange(i, 'expectedReturn', parseFloat(e.target.value) / 100)}
                                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.25rem' }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Volatility</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number" step="0.1"
                                        value={(bucket.volatility * 100).toFixed(1)}
                                        onChange={e => handleBucketChange(i, 'volatility', parseFloat(e.target.value) / 100)}
                                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.25rem' }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }} onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn" onClick={() => onSave(localConfig)}>
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
