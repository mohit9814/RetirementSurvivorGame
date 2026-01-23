
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameConfig } from '../types';

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
    customStrategyConfig?: GameConfig['customStrategy'];
    onStrategyChange: (strategy: GameConfig['rebalancingStrategy'], customConfig?: GameConfig['customStrategy']) => void;
    currentYear: number;
    survivalYears: number;
    disabled?: boolean;
}

export const StrategyHeader: React.FC<StrategyHeaderProps> = ({ currentStrategy, customStrategyConfig, onStrategyChange, currentYear, survivalYears, disabled }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    const info = STRATEGIES[currentStrategy] || { label: currentStrategy, desc: 'Custom Strategy', shortDesc: 'Custom' };

    // Update menu position when opening
    useEffect(() => {
        if (showMenu && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Use FIXED positioning for everything to avoid stacking context issues
            // rect properties are already viewport-relative, which matches position: fixed
            setMenuPosition({
                top: rect.bottom + 8, // Just a small buffer to avoid overlap
                left: rect.left
            });
        }
    }, [showMenu]);

    // Close menu on scroll to prevent it detaching
    useEffect(() => {
        const handleScroll = () => {
            if (showMenu) setShowMenu(false);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [showMenu]);

    const DropdownContent = () => {
        // Mobile Check (simple width check or assume if screen is small)
        const isMobile = window.innerWidth <= 768;

        const style: React.CSSProperties = isMobile ? {
            // Mobile: Centered Modal
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 9999 // NUCLEAR Z-INDEX
        } : {
            // Desktop: Fixed Popover
            position: 'fixed',
            top: menuPosition?.top || 0,
            left: menuPosition?.left || 0,
            zIndex: 9999, // NUCLEAR Z-INDEX
            minWidth: '280px',
            maxHeight: '60vh',
            overflowY: 'auto'
        };

        return (
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 2050,
                    background: isMobile ? 'rgba(0,0,0,0.6)' : 'transparent',
                    backdropFilter: isMobile ? 'blur(4px)' : 'none'
                }}
                onClick={() => setShowMenu(false)}
            >
                <div
                    style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.7)',
                        ...style
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                >
                    {isMobile && <div style={{ padding: '1rem 1rem 0.5rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Select Strategy</div>}

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
                                transition: 'background 0.2s',
                                display: 'flex', flexDirection: 'column', gap: '2px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = currentStrategy === key ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}
                        >
                            <div style={{ color: currentStrategy === key ? '#38bdf8' : '#e2e8f0', fontWeight: 600, fontSize: '0.95rem' }}>{strat.label}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.3 }}>{strat.desc}</div>
                        </div>
                    ))}

                    {isMobile && (
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <button onClick={() => setShowMenu(false)} style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '0.5rem 2rem', borderRadius: '8px' }}>Cancel</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Year Badge */}
            <div style={{
                background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px', padding: '0.2rem 0.5rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minWidth: '60px'
            }}>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1, marginBottom: '2px' }}>Year</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f0f9ff', lineHeight: 1 }}>
                    <span style={{ color: '#38bdf8' }}>{currentYear}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 2px' }}>/</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{survivalYears}</span>
                </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>

                {/* Label */}
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Strategy
                </span>

                {/* Selector Trigger */}
                <div
                    ref={triggerRef}
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


                {/* Dropdown Menu - Portalized */}
                {showMenu && createPortal(<DropdownContent />, document.body)}

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
        </div>
    );
};
