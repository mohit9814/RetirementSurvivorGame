import React, { useState } from 'react';

interface WelcomeScreenProps {
    onStart: (username: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onStart(username.trim());
        }
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem'
        }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
                <h1 className="hero-text" style={{ marginBottom: '0.5rem' }}>Retirement<br />Bucket Survivor</h1>
                <p className="compact-text" style={{ fontSize: '1rem', marginBottom: '2rem' }}>
                    Can you manage your portfolio to survive 30 years of inflation and market crashes?
                </p>

                {/* Challenge Banner */}
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#facc15', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🏆</span> Beat The Machine
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                        <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Target Success Rate</div>
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>98.5% <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(Glide Path)</span></div>
                        </div>
                        <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Target Wealth</div>
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>₹5.8 Cr <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(Tactical)</span></div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label className="compact-h" style={{ display: 'block', marginBottom: '0.5rem' }}>Enter Commander Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. Captain Finance"
                            className="glass-panel"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.2rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn"
                        disabled={!username.trim()}
                        style={{ fontSize: '1.2rem', padding: '1rem', marginTop: '1rem' }}
                    >
                        Start Mission
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WelcomeScreen;
