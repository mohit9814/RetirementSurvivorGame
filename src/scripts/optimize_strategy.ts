
import { initializeGame, advanceYear, INITIAL_CONFIG } from '../engine/GameEngine.ts';
import { applyRebalancing } from '../engine/RebalancingEngine.ts';
import type { GameConfig, GameState } from '../types/index.ts';

// Suppress logs during optimization
const originalConsoleLog = console.log;
function suppressLogs() { console.log = () => { }; }
function restoreLogs() { console.log = originalConsoleLog; }

// --- USER CONSTRAINTS ---
const BASE_CONFIG: GameConfig = {
    ...INITIAL_CONFIG,
    initialCorpus: 45000000, // 4.5 Cr
    initialExpenses: 1200000, // 12 Lakhs
    inflationRate: 0.07,     // 7%
    survivalYears: 40,       // Max Horizon
    rebalancingStrategy: 'Tactical',
    bucketConfigs: [
        { name: 'Bucket 1', type: 'Cash', allocation: 0, expectedReturn: 0.045, volatility: 0.01 },  // 4.5%, 1%
        { name: 'Bucket 2', type: 'Income', allocation: 0, expectedReturn: 0.09, volatility: 0.08 }, // 9%, 8%
        { name: 'Bucket 3', type: 'Growth', allocation: 0, expectedReturn: 0.12, volatility: 0.13 }, // 12%, 13%
    ]
};

const NUM_SIMULATIONS = 50; // Per configuration
const TACTICAL_BUFFER_OPTIONS = [2, 3, 4, 5];

// Generate Allocation Mixes (Step 5%)
// B1: 5% - 20%
// B2: 20% - 60%
// B3: Remainder
function generateAllocations() {
    const allocations = [];
    for (let b1 = 5; b1 <= 20; b1 += 5) {
        for (let b2 = 10; b2 <= 60; b2 += 10) {
            const b3 = 100 - b1 - b2;
            if (b3 >= 10) {
                allocations.push([b1 / 100, b2 / 100, b3 / 100]);
            }
        }
    }
    return allocations;
}

function runSimulation(config: GameConfig): number {
    let state = initializeGame(config);
    // Explicitly apply randomness by running advanceYear which calls MarketEngine
    while (!state.isGameOver && state.currentYear < config.survivalYears) {
        // Advance Year (Market returns + withdrawals)
        state = advanceYear(state);
        // Apply Rebalancing Logic
        state = applyRebalancing(state);
    }
    return state.currentYear;
}

async function optimize() {
    const allocations = generateAllocations();
    console.log(`🔎 Optimization Start: Testing ${allocations.length * TACTICAL_BUFFER_OPTIONS.length} configurations x ${NUM_SIMULATIONS} sims...`);

    const results = [];

    // Suppress logs for speed and cleanliness
    suppressLogs();

    for (const alloc of allocations) {
        for (const tacticalYears of TACTICAL_BUFFER_OPTIONS) {
            const currentConfig = JSON.parse(JSON.stringify(BASE_CONFIG));
            currentConfig.bucketConfigs[0].allocation = alloc[0];
            currentConfig.bucketConfigs[1].allocation = alloc[1];
            currentConfig.bucketConfigs[2].allocation = alloc[2];
            currentConfig.tacticalCashBufferYears = tacticalYears;

            const survivalYearsPoints = [];
            for (let i = 0; i < NUM_SIMULATIONS; i++) {
                survivalYearsPoints.push(runSimulation(currentConfig));
            }

            // Metrics
            survivalYearsPoints.sort((a, b) => a - b);
            const medianSurvival = survivalYearsPoints[Math.floor(NUM_SIMULATIONS / 2)];
            const worstCase10th = survivalYearsPoints[Math.floor(NUM_SIMULATIONS * 0.1)]; // 10th percentile

            results.push({
                alloc: alloc.map(a => (a * 100).toFixed(0) + '%'),
                tacticalYears,
                medianSurvival,
                worstCase10th
            });
        }
    }

    restoreLogs();

    // Sort by Median Survival, then Worst Case
    results.sort((a, b) => {
        if (b.medianSurvival !== a.medianSurvival) return b.medianSurvival - a.medianSurvival;
        return b.worstCase10th - a.worstCase10th;
    });

    console.log('\n🏆 TOP 5 CONFIGURATIONS 🏆');
    console.log('----------------------------------------------------------------');
    console.log('| B1 / B2 / B3 | Buffer | Median Years | Worst 10% Years |');
    console.log('----------------------------------------------------------------');
    results.slice(0, 5).forEach(r => {
        console.log(`| ${r.alloc.join(' / ')} |   ${r.tacticalYears}y   |      ${r.medianSurvival}      |        ${r.worstCase10th}        |`);
    });
    console.log('----------------------------------------------------------------');

    console.log('\n⚠️ WORST CONFIGURATIONS ⚠️');
    results.slice(-3).forEach(r => {
        console.log(`| ${r.alloc.join(' / ')} |   ${r.tacticalYears}y   |      ${r.medianSurvival}      |        ${r.worstCase10th}        |`);
    });
}

optimize();
