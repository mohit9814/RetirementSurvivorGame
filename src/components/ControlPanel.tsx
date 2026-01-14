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
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="hero-text" style={{ fontSize: '2rem', margin: 0 }}>Year {gameState.currentYear}</h2>
                    <div className="compact-text" style={{ marginTop: '0.25rem' }}>
                        Inflation: <span style={{ color: 'var(--color-text-primary)' }}>{(gameState.history[gameState.history.length - 1].inflation * 100 - 100).toFixed(0)}%</span>
                    </div>
                </div>
                {/* Speed Controls */}
                {!gameState.isGameOver && (
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
                        {[2000, 1000, 500, 200].map((s) => (
                            <button
                                key={s}
                                onClick={() => playback.setSpeed(s)}
                                style={{
                                    padding: '0.25rem 0.5rem', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
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
            </div>

            {gameState.isGameOver ? (
                <div style={{
                    padding: '1rem',
                    background: gameState.gameOverReason?.includes('Victory') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${gameState.gameOverReason?.includes('Victory') ? 'var(--color-success)' : 'var(--color-danger)'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        color: gameState.gameOverReason?.includes('Victory') ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem'
                    }}>
                        {gameState.gameOverReason?.includes('Victory') ? '🎉 MISSION ACCOMPLISHED' : 'GAME OVER'}
                    </div>
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>{gameState.gameOverReason}</div>

                    <button className="btn" onClick={onRestart} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)' }}>
                        Restart Mission
                    </button>
                    {gameState.gameOverReason?.includes('Victory') && onExtend && (
                        <button className="btn" onClick={onExtend} style={{ flex: 1, background: 'var(--color-success)', color: 'white' }}>
                            Continue Journey 🚀
                        </button>
                    )}
                    {gameState.gameOverReason?.includes('Victory') && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                            Extend the simulation by 10 years and keep playing.
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>

                    {/* Play/Pause Button */}
                    <button
                        className="btn"
                        onClick={playback.togglePlay}
                        style={{
                            flex: 1, padding: '1rem', fontSize: '1.2rem',
                            background: playback.isPlaying ? 'var(--color-warning)' : 'var(--color-success)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        {playback.isPlaying ? (
                            <>
                                <span>⏸ Pause</span>
                            </>
                        ) : (
                            <>
                                <span>▶ Play</span>
                            </>
                        )}
                    </button>

                    {/* Step Button (Manual) */}
                    <button
                        className="btn btn-secondary"
                        onClick={onNextYear}
                        disabled={playback.isPlaying}
                        style={{
                            padding: '0 1rem',
                            opacity: playback.isPlaying ? 0.5 : 1,
                            cursor: playback.isPlaying ? 'not-allowed' : 'pointer'
                        }}
                        title="Step Forward (1 Year)"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            )
            }
        </div >
    );
};

export default ControlPanel;
