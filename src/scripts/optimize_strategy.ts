
import { initializeGame, advanceYear, INITIAL_CONFIG } from '../engine/GameEngine.ts';
import { applyRebalancing } from '../engine/RebalancingEngine.ts';
import type { GameConfig, GameState } from '../types/index.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Suppress logs during optimization
const originalConsoleLog = console.log;
function suppressLogs() { console.log = () => { }; }
function restoreLogs() { console.log = originalConsoleLog; }

// --- USER CONSTRAINTS ---
const BASE_CONFIG: GameConfig = {
    ...INITIAL_CONFIG,
    initialCorpus: 45000000, // 4.5 Cr
    initialExpenses: 1000000, // 10 Lakhs
    inflationRate: 0.07,     // 7%
    survivalYears: 50,       // 50 Years
    rebalancingStrategy: 'Tactical',
    bucketConfigs: [
        { name: 'Bucket 1', type: 'Cash', allocation: 0, expectedReturn: 0.05, volatility: 0.06 },
        { name: 'Bucket 2', type: 'Income', allocation: 0, expectedReturn: 0.092, volatility: 0.078 },
        { name: 'Bucket 3', type: 'Growth', allocation: 0, expectedReturn: 0.136, volatility: 0.161 },
    ]
};

const NUM_SIMULATIONS = 50; // High Fidelity Run
const TACTICAL_BUFFER_OPTIONS = [2, 3]; // Reduced options to save time

function runSimulation(config: GameConfig): number {
    let state = initializeGame(config);
    while (!state.isGameOver && state.currentYear < config.survivalYears) {
        state = advanceYear(state);
        state = applyRebalancing(state);
    }
    return state.currentYear;
}

async function optimize() {
    const reportPath = path.join(process.cwd(), 'analysis-reports', `baseline_comparison_${Date.now()}.txt`);

    // Helper to log to both console and file
    const log = (msg: string) => {
        originalConsoleLog(msg);
        fs.appendFileSync(reportPath, msg + '\n');
    };

    log('=====================================================================================');
    log('🚀 HIGH FIDELITY STRATEGY BASELINE RUN');
    log('=====================================================================================');
    log(`Date: ${new Date().toISOString()}`);
    log(`Simulations per Strategy: ${NUM_SIMULATIONS}`);
    log('--- PARAMETERS ---');
    log(`Initial Corpus:   ${(BASE_CONFIG.initialCorpus / 10000000).toFixed(2)} Cr`);
    log(`Annual Expenses:  ${(BASE_CONFIG.initialExpenses / 100000).toFixed(2)} Lakhs`);
    log(`Survival Horizon: ${BASE_CONFIG.survivalYears} Years`);
    log(`Inflation Rate:   ${(BASE_CONFIG.inflationRate * 100).toFixed(1)}%`);
    log('-------------------------------------------------------------------------------------');

    // Focus on Top 3 Contenders to save time
    const strategies = ['GlidePath', 'AI_Max_Survival', 'RefillBucket1', 'FixedAllocation'];
    const results: any[] = [];

    // Test 3 Distinct Allocations
    const allocations = [
        { name: 'Conserv (5/65/30)', alloc: [0.05, 0.65, 0.30] }, // High Safety
        { name: 'Balanced (10/50/40)', alloc: [0.10, 0.50, 0.40] }, // Standard
        { name: 'Growth (5/35/60)', alloc: [0.05, 0.35, 0.60] }  // High Equity
    ];

    suppressLogs();

    for (const strategy of strategies) {
        for (const preset of allocations) {
            const currentConfig = JSON.parse(JSON.stringify(BASE_CONFIG));
            currentConfig.rebalancingStrategy = strategy;
            currentConfig.bucketConfigs[0].allocation = preset.alloc[0];
            currentConfig.bucketConfigs[1].allocation = preset.alloc[1];
            currentConfig.bucketConfigs[2].allocation = preset.alloc[2];
            // Tactical buffer defaults to 0 for these non-tactical strategies (or ignored)
            currentConfig.tacticalCashBufferYears = 0;

            const survivalYearsPoints = [];
            // Reduced to 50 for matrix run (4 strategies * 3 allocs * 50 = 600 sims)
            // Fast check for sensitivity key.
            const SIMS_PER_CONFIG = 50;

            for (let i = 0; i < SIMS_PER_CONFIG; i++) {
                survivalYearsPoints.push(runSimulation(currentConfig));
            }

            survivalYearsPoints.sort((a, b) => a - b);
            const medianSurvival = survivalYearsPoints[Math.floor(SIMS_PER_CONFIG / 2)];
            const worstCase10th = survivalYearsPoints[Math.floor(SIMS_PER_CONFIG * 0.1)];
            const survivalRate = survivalYearsPoints.filter(y => y >= 50).length / SIMS_PER_CONFIG;

            results.push({
                strategy,
                allocName: preset.name,
                medianSurvival,
                worstCase10th,
                survivalRatePercent: survivalRate * 100,
                survivalRateDisplay: (survivalRate * 100).toFixed(1) + '%'
            });
        }
    }

    restoreLogs();

    results.sort((a, b) => b.survivalRatePercent - a.survivalRatePercent);

    log('\n🏆 ALLOCATION SENSITIVITY MATRIX 🏆');
    log('-----------------------------------------------------------------------------------------------');
    log('| Strategy          | Allocation          | Survival Rate | Median Years | Worst 10% |');
    log('-----------------------------------------------------------------------------------------------');
    results.forEach(r => {
        const strat = r.strategy.padEnd(17, ' ');
        const alloc = r.allocName.padEnd(19, ' ');
        const rate = r.survivalRateDisplay.padEnd(13, ' ');
        const med = r.medianSurvival.toString().padEnd(12, ' ');
        const worst = r.worstCase10th.toString().padEnd(9, ' ');
        log(`| ${strat} | ${alloc} | ${rate} | ${med} | ${worst} |`);
    });
    log('-----------------------------------------------------------------------------------------------');
}

optimize();
