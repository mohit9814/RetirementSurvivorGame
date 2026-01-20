import React, { useState, useEffect } from 'react';
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

    // Responsive Check (Simple width check or hook)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fixed positions as simple percentages for Desktop
    const positions = ['16.66%', '50%', '83.33%'];
    const getPos = (i: number) => positions[i];

    // Duration: 90% of year tick to maximize visibility
    const durationSec = (speed * 0.9) / 1000;

    if (isMobile) {
        // MOBILE EXPERIENCE: Insight Card (Bottom Sheet)
        // Auto-dismiss after 6 seconds to give user time to read, but non-blocking so game continues if needed.
        // Actually, since it's "speed" based, maybe we should stick to speed? 
        // No, mobile users need more time. Hardcode a clearer duration or use speed * 2.

        return (
            <div className="fixed inset-x-0 bottom-24 z-[100] px-4 animate-in slide-in-from-bottom-5 fade-in duration-500" style={{ pointerEvents: 'none' }}>
                <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/30 text-slate-100 p-4 rounded-xl shadow-2xl ring-1 ring-black/5" style={{ pointerEvents: 'auto' }}>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-400 overflow-hidden shadow-sm">
                            <img src="/src/assets/einstein.png" alt="Wizard" className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerText = '🧙‍♂️'; }} />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider mb-1">Strategy Intervention</h4>
                                <p className="text-xs text-slate-400 leading-tight">I've rebalanced your portfolio to stay on track.</p>
                            </div>

                            <div className="space-y-2">
                                {latestMoves.map((move, i) => (
                                    <div key={i} className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-amber-100 text-sm">{move.reason}</span>
                                            <span className="font-bold text-white text-sm">{formatCurrency(move.amount)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>Bucket {move.fromBucketIndex + 1}</span>
                                            <span className="material-symbols-outlined text-[10px] text-slate-500">arrow_forward</span>
                                            <span>Bucket {move.toBucketIndex + 1}</span>
                                            {move.taxIncurred > 0 && (
                                                <span className="ml-auto text-red-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">receipt_long</span>
                                                    -{formatCurrency(move.taxIncurred)} Tax
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // DESKTOP EXPERIENCE: Flying Animations
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
                    opacity: 0,
                    pointerEvents: 'none' // CRITICAL: Ensure invisible wizards don't block clicks
                } as React.CSSProperties;

                return (
                    <div key={uniqueKey} className="wizard-flyer" style={dynamicStyle}>
                        <WizardIcon />
                        <WizardBubble move={move} />

                        {/* Tax Animation Particle */}
                        {move.taxIncurred > 0 && (
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
        {move.taxIncurred > 0 && (
            <div style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2px' }}>
                Tax: {formatCurrency(move.taxIncurred)}
            </div>
        )}
    </div>
);

export default GenieNotification;
