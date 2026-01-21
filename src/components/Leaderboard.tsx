import React, { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types';
import { getLeaderboard, getUserHistory } from '../utils/storage';
import { formatCurrency } from '../utils/currency';

interface LeaderboardProps {
    currentUsername?: string;
    onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUsername, onClose }) => {
    const [view, setView] = useState<'global' | 'personal'>('global');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        if (view === 'global') {
            const allEntries = getLeaderboard();
            // Deduplicate: Keep only the best score per username
            const uniqueEntriesMap = new Map<string, LeaderboardEntry>();

            allEntries.forEach(entry => {
                const existing = uniqueEntriesMap.get(entry.username);
                if (!existing || entry.score > existing.score) {
                    uniqueEntriesMap.set(entry.username, entry);
                }
            });

            const sortedUnique = Array.from(uniqueEntriesMap.values())
                .sort((a, b) => b.score - a.score);

            setEntries(sortedUnique);
        } else if (currentUsername) {
            setEntries(getUserHistory(currentUsername));
        }
    }, [view, currentUsername]);

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
        }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="hero-text" style={{ fontSize: '1.5rem', margin: 0 }}>Mission Report</h2>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>

                <div style={{ padding: '1rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <button
                        className={`btn ${view === 'global' ? '' : 'btn-secondary'}`}
                        onClick={() => setView('global')}
                        style={{ flex: 1 }}
                    >
                        Global Command
                    </button>
                    {currentUsername && (
                        <button
                            className={`btn ${view === 'personal' ? '' : 'btn-secondary'}`}
                            onClick={() => setView('personal')}
                            style={{ flex: 1 }}
                        >
                            Log: {currentUsername}
                        </button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text-primary)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>Rank</th>
                                <th style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>Commander</th>
                                <th style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>Status</th>
                                <th style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>Survived</th>
                                <th style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>Wealth</th>
                                <th style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No mission records found. Use "Move Funds" to start a simulation!
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, i) => (
                                    <tr key={entry.id} style={{
                                        background: entry.username === currentUsername ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>#{i + 1}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{entry.username}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700,
                                                background: entry.outcome === 'Victory' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                                                color: entry.outcome === 'Victory' ? 'var(--color-success)' : 'var(--color-danger)'
                                            }}>
                                                {entry.outcome.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{entry.survivalYears}/{entry.maxYears} Yrs</td>
                                        <td style={{ padding: '0.75rem' }}>{formatCurrency(entry.endingWealth)}</td>
                                        <td className="number-mono" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>
                                            {new Intl.NumberFormat().format(entry.score)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
