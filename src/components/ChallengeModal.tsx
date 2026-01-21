import React, { useState, useEffect } from 'react';

export const ChallengeModal: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenStrategyChallenge');
        if (!hasSeen) {
            // Delay slightly for effect
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('hasSeenStrategyChallenge', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="glass-panel" style={{
                maxWidth: '450px', padding: '2rem', textAlign: 'center',
                border: '1px solid #f59e0b',
                boxShadow: '0 0 50px rgba(245, 158, 11, 0.2)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧙‍♂️</div>
                <h2 style={{ margin: '0 0 0.5rem', color: '#fbbf24', fontSize: '1.8rem' }}>A New Challenge!</h2>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Standard strategies are for rookies. Can you survive 60 years by designing your own?
                    <br /><br />
                    Open the <b style={{ color: '#38bdf8' }}>Strategy Menu</b> and select <b style={{ color: '#38bdf8' }}>Custom</b> to build your own algorithm.
                </p>
                <button
                    onClick={handleDismiss}
                    className="btn btn-primary"
                    style={{
                        width: '100%', padding: '1rem', fontSize: '1.1rem',
                        background: 'linear-gradient(to right, #f59e0b, #d97706)'
                    }}
                >
                    Accept Challenge
                </button>
            </div>
        </div>
    );
};
