import React, { useState, useEffect } from 'react';
import type { RebalancingEvent } from '../types';
import { formatCurrency } from '../utils/currency';

interface GenieNotificationProps {
    latestMoves?: RebalancingEvent[];
    year: number;
    speed: number;
    showInterventions?: boolean;
}

const GenieNotification: React.FC<GenieNotificationProps> = ({ latestMoves, year, speed, showInterventions = true }) => {
    // Responsive Check (Moved up to fix Rules of Hooks)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isVisible, setIsVisible] = useState(true);

    // Reset visibility when year changes
    useEffect(() => {
        setIsVisible(true);
        // Auto-dismiss based on speed, but minimum 3s to be readable
        const duration = Math.max(3000, speed * 5);
        const timer = setTimeout(() => setIsVisible(false), duration);
        return () => clearTimeout(timer);
    }, [year, speed]); // Added speed to dependency

    // Logic Checks
    // 1. Global switch or no data
    if (!showInterventions || !latestMoves || latestMoves.length === 0) return null;

    // 2. Mobile fast-forward optimization (User Request: "keeps showing up")
    if (isMobile && speed < 1000) return null;

    // 3. User dismissed or timed out
    if (!isVisible) return null;

    const handleDismiss = () => setIsVisible(false);

    // Unified Card UI for both Desktop and Mobile
    return (
        <div
            onClick={handleDismiss}
            style={{
                position: 'fixed',
                bottom: isMobile ? '80px' : '2rem',
                left: isMobile ? '1rem' : 'auto',
                right: isMobile ? '1rem' : '2rem',
                width: isMobile ? 'auto' : '400px',
                zIndex: 100,
                cursor: 'pointer',
                animation: 'slideUp 0.5s ease-out forwards'
            }}>
            <div className="glass-panel" style={{
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px', flexShrink: 0,
                        borderRadius: '50%', background: '#fef3c7',
                        border: '2px solid #fbbf24', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img src="/src/assets/einstein.png" alt="Wizard" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerText = '🧙‍♂️'; }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Portfolio Rebalancing</h4>
                            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>Strategy logic applied to maintain targets.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {latestMoves.map((move, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#fef3c7', fontSize: '0.85rem', fontWeight: 500 }}>{move.reason}</span>
                                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(move.amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                        <span>B{move.fromBucketIndex + 1}</span>
                                        <span>➝</span>
                                        <span>B{move.toBucketIndex + 1}</span>
                                        {(move.taxIncurred ?? 0) > 0 && (
                                            <span style={{ marginLeft: 'auto', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>💸</span>
                                                -{formatCurrency(move.taxIncurred ?? 0)} Tax
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default GenieNotification;
