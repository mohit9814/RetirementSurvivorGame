import React from 'react';
import type { GameState } from '../types';

interface ControlPanelProps {
    gameState: GameState;
    onNextYear: () => void;
    onRestart: () => void;
    onExtend?: () => void; // Optional for Victory screen extension
    playback: {
        isPlaying: boolean;
        togglePlay: () => void;
        setSpeed: (speed: number) => void;
        speed: number;
    };
}

const ControlPanel: React.FC<ControlPanelProps> = ({ gameState, onNextYear, onRestart, onExtend, playback }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
        <div className="glass-panel" style={{
            padding: '0.75rem',
            // flex: isMobile ? 'none' : 1, // Removed flex: 1 to prevent taking up vertical space
            display: 'flex',
            flexDirection: 'row', // Always row
            gap: '1.5rem',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            {/* Year & Inflation Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem' }}>
                <h2 className="hero-text" style={{ fontSize: isMobile ? '1.1rem' : '2rem', margin: 0, whiteSpace: 'nowrap' }}>
                    Year {gameState.currentYear}
                </h2>
                {!isMobile && (
                    <div className="compact-text" style={{ marginTop: '0.25rem' }}>
                        Inflation: <span style={{ color: 'var(--color-text-primary)' }}>{(gameState.history[gameState.history.length - 1].inflation * 100 - 100).toFixed(0)}%</span>
                    </div>
                )}
            </div>

            {/* Speed Controls - Compact on Mobile */}
            {!gameState.isGameOver && (
                <div style={{ display: 'flex', gap: '0.15rem', background: 'rgba(0,0,0,0.2)', padding: '0.15rem', borderRadius: 'var(--radius-sm)' }}>
                    {[2000, 1000, 500, 200].map((s) => (
                        <button
                            key={s}
                            onClick={() => playback.setSpeed(s)}
                            style={{
                                padding: isMobile ? '0.15rem 0.3rem' : '0.25rem 0.5rem',
                                fontSize: isMobile ? '0.6rem' : '0.7rem',
                                border: 'none', borderRadius: '4px', cursor: 'pointer',
                                background: playback.speed === s ? 'var(--color-accent)' : 'transparent',
                                color: playback.speed === s ? 'white' : 'var(--color-text-secondary)',
                                fontWeight: playback.speed === s ? 700 : 400
                            }}
                        >
                            {s === 2000 ? '0.5x' : s === 1000 ? '1x' : s === 500 ? '2x' : '5x'}
                        </button>
                    ))}
                </div>
            )}

            {/* Game Controls - Compact Row */}
            {gameState.isGameOver ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        color: gameState.gameOverReason?.includes('Victory') ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap'
                    }}>
                        {gameState.gameOverReason?.includes('Victory') ? '🎉 VICTORY' : '💀 GAME OVER'}
                    </div>

                    <button className="btn" onClick={onRestart} style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid var(--glass-border)',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem'
                    }}>
                        Restart
                    </button>

                    {gameState.gameOverReason?.includes('Victory') && onExtend && (
                        <button className="btn" onClick={onExtend} style={{
                            background: 'var(--color-success)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem'
                        }}>
                            +10Y
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {/* Play/Pause Button */}
                    <button
                        className="btn"
                        onClick={playback.togglePlay}
                        style={{
                            padding: isMobile ? '0.4rem 0.75rem' : '1rem',
                            fontSize: isMobile ? '0.85rem' : '1.2rem',
                            background: playback.isPlaying ? 'var(--color-warning)' : 'var(--color-success)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        {playback.isPlaying ? '⏸' : '▶'}
                        {!isMobile && <span>{playback.isPlaying ? 'Pause' : 'Play'}</span>}
                    </button>

                    {/* Step Button */}
                    <button
                        className="btn btn-secondary"
                        onClick={onNextYear}
                        disabled={playback.isPlaying}
                        style={{
                            padding: isMobile ? '0.4rem' : '0 1rem',
                            opacity: playback.isPlaying ? 0.5 : 1,
                            cursor: playback.isPlaying ? 'not-allowed' : 'pointer'
                        }}
                        title="Step Forward (1 Year)"
                    >
                        <svg width={isMobile ? "16" : "24"} height={isMobile ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ControlPanel;
