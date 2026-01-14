import React, { useState } from 'react';
import type { GameConfig } from '../types';
import { INITIAL_CONFIG } from '../engine/GameEngine';
import CurrencyInput from './CurrencyInput';

import { saveConfig, loadConfig } from '../utils/storage';

interface SetupFormProps {
    onStart: (config: GameConfig) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
    // Load saved config or use defaults
    const savedConfig = loadConfig();
    const defaults = savedConfig || INITIAL_CONFIG;

    const [corpus, setCorpus] = useState(defaults.initialCorpus);
    const [expenses, setExpenses] = useState(defaults.initialExpenses);
    const [survivalYears, setSurvivalYears] = useState(defaults.survivalYears || 30); // Fallback if saved config is old

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalConfig = {
            ...(savedConfig || INITIAL_CONFIG), // Preserve other settings like bucket configs
            initialCorpus: corpus,
            initialExpenses: expenses,
            survivalYears: survivalYears,
        };
        saveConfig(finalConfig);
        onStart(finalConfig);
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Flight Plan</h2>
            <form onSubmit={handleSubmit}>
                <CurrencyInput
                    label="Total Retirement Corpus"
                    value={corpus}
                    onChange={setCorpus}
                />

                <CurrencyInput
                    label="Annual Expenses (Inflation assumed at 7% p.a.)"
                    value={expenses}
                    onChange={setExpenses}
                />

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Target Survival Duration (Years)</label>
                    <input
                        type="range" min="10" max="200" step="5"
                        value={survivalYears}
                        onChange={(e) => setSurvivalYears(parseInt(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                        {survivalYears} Years
                    </div>
                </div>

                <button type="submit" className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                    Initialize Simulation
                </button>
            </form>
        </div>
    );
};

export default SetupForm;
