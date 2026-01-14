
import React, { useEffect, useState } from 'react';
import type { RebalancingEvent } from '../types';
import { formatCurrency } from '../utils/currency';

interface GenieNotificationProps {
    latestMoves?: RebalancingEvent[];
    year: number;
    speed: number;
}

const GenieNotification: React.FC<GenieNotificationProps> = ({ latestMoves, year, speed }) => {
    // Only render if we have moves
    if (!latestMoves || latestMoves.length === 0) return null;

    // Fixed positions as simple percentages
    const positions = ['16.66%', '50%', '83.33%'];
    const getPos = (i: number) => positions[i];

    // Duration: 90% of year tick to maximize visibility
    const durationSec = (speed * 0.9) / 1000;

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 100,
            overflow: 'hidden'
        }}>
            {/* Static Keyframes Definition - Rendered Once */}
            <style>{`
                @keyframes wizard-fly {
                    0% { left: var(--start-pos); opacity: 0; transform: translateX(-50%) scale(0.5); }
                    10% { opacity: 1; transform: translateX(-50%) scale(1); }
                    80% { left: var(--end-pos); opacity: 1; transform: translateX(-50%) scale(1); }
                    100% { left: var(--end-pos); opacity: 0; transform: translateX(-50%) scale(0.8); }
                }
                @keyframes tax-fly {
                    0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
                    20% { transform: translate(-50%, -40px) scale(1); opacity: 1; }
                    80% { transform: translate(-50%, -80px) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -120px) scale(0.5); opacity: 0; }
                }
            `}</style>

            {latestMoves.map((move, i) => {
                const uniqueKey = `${year}-${i}`;
                const start = getPos(move.fromBucketIndex);
                const end = getPos(move.toBucketIndex);

                // Stagger: 15% of speed per item (tighter overlap)
                const delaySec = (i * (speed * 0.15)) / 1000;

                // Pass dynamic positions via CSS Variables
                const dynamicStyle = {
                    '--start-pos': start,
                    '--end-pos': end,
                    position: 'absolute',
                    bottom: '40%',
                    left: start, // Fallback
                    transform: 'translateX(-50%)',
                    // Use 'linear' or 'ease-out' for better readability while moving
                    animation: `wizard-fly ${durationSec}s ease-out forwards`,
                    animationDelay: `${delaySec}s`,
                    opacity: 0
                } as React.CSSProperties;

                return (
                    <div key={uniqueKey} className="wizard-flyer" style={dynamicStyle}>
                        <WizardIcon />
                        <WizardBubble move={move} />

                        {/* Tax Animation Particle */}
                        {move.taxIncurred && (
                            <div style={{
                                position: 'absolute',
                                left: '50%', top: '50%',
                                animation: `tax-fly ${durationSec}s ease-in-out forwards`,
                                animationDelay: `${delaySec + (durationSec * 0.5)}s`, // Start mid-flight
                                opacity: 0,
                                zIndex: 5
                            }}>
                                <div style={{
                                    background: '#ef4444', color: 'white',
                                    padding: '4px 8px', borderRadius: '12px',
                                    fontSize: '0.7rem', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    💸 -{formatCurrency(move.taxIncurred)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const WizardIcon = () => (
    <div style={{
        width: '80px', height: '80px',
        background: 'white', borderRadius: '50%',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        border: '3px solid #fbbf24',
        marginBottom: '0.75rem'
    }}>
        <img src="/src/assets/einstein.png" alt="Wizard" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerText = '🧙‍♂️'; }} />
    </div>
);

const WizardBubble = ({ move }: { move: RebalancingEvent }) => (
    <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '16px',
        border: '1px solid #fbbf24',
        fontSize: '0.85rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        minWidth: '120px'
    }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '2px' }}>{move.reason}</div>
        <div style={{ color: '#fff', fontWeight: 500 }}>
            {formatCurrency(move.amount)}
        </div>
        {move.taxIncurred && (
            <div style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2px' }}>
                Tax: {formatCurrency(move.taxIncurred)}
            </div>
        )}
    </div>
);

export default GenieNotification;
