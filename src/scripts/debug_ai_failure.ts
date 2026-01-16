
import { SurvivalOptimizer } from '../engine/OptimizationEngine';
import { GameState, GameConfig } from '../types';
import { simulateNextYearPhysics } from '../engine/PhysicsEngine';

const mockConfig: GameConfig = {
    initialCorpus: 50000000, // 5 Cr
    initialExpenses: 1200000, // 12 Lakhs
    inflationRate: 0.07,
    survivalYears: 30,
    enableTaxation: true,
    rebalancingStrategy: 'AI_Max_Survival',
    bucketConfigs: [
        { type: 'Cash', name: 'Cash', allocation: 0.1, expectedReturn: 0.04, volatility: 0.01 },
        { type: 'Income', name: 'Income', allocation: 0.3, expectedReturn: 0.08, volatility: 0.08 },
        { type: 'Growth', name: 'Growth', allocation: 0.6, expectedReturn: 0.12, volatility: 0.15 }
    ]
};

// Scenario: Year 1, Wealth 5 Cr (Healthy)
const healthyState: GameState = {
    currentYear: 1,
    startYear: 2024,
    maxYears: 30,
    buckets: [
        { type: 'Cash', name: 'Cash', balance: 5000000, lastYearReturn: 0 },
        { type: 'Income', name: 'Income', balance: 15000000, lastYearReturn: 0 },
        { type: 'Growth', name: 'Growth', balance: 30000000, lastYearReturn: 0 }
    ],
    history: [],
    config: mockConfig,
    isGameOver: false,
    sessionId: 'test-healthy'
};

// Scenario: Year 5, Wealth Dropped to 2 Cr (Crisis mode)
const crisisState: GameState = {
    currentYear: 5,
    startYear: 2024,
    maxYears: 30,
    buckets: [
        { type: 'Cash', name: 'Cash', balance: 1000000, lastYearReturn: 0 },
        { type: 'Income', name: 'Income', balance: 4000000, lastYearReturn: 0 },
        { type: 'Growth', name: 'Growth', balance: 15000000, lastYearReturn: 0 }
    ],
    history: [],
    config: mockConfig,
    isGameOver: false,
    sessionId: 'test-crisis'
};

async function debugOptimizer(label: string, state: GameState) {
    console.log(`\n--- DEBUG SCENARIO: ${label} ---`);
    console.log(`Total Wealth: ${(state.buckets.reduce((a, b) => a + b.balance, 0) / 10000000).toFixed(2)} Cr`);

    // Patch console.log to capture Optimizer output
    const originalLog = console.log;
    // console.log = (...args) => {}; // Silence internal logs if needed

    const optimalAlloc = SurvivalOptimizer.findOptimalAllocation(state, 100); // 100 Sims per candidate

    // console.log = originalLog; // Restore
    console.log(`\nOPTIMAL ALLOCATION: [${optimalAlloc.map(n => (n * 100).toFixed(0) + '%').join(', ')}]`);

    // Analyze SAFETY of this choice
    console.log("Simulating 1 year of this choice...");
    // Force set buckets to this allocation roughly
    const total = state.buckets.reduce((current, b) => current + b.balance, 0);
    const testState = {
        ...state,
        buckets: state.buckets.map((b, i) => ({ ...b, balance: total * optimalAlloc[i] }))
    };

    // Run 10 physics steps
    let survived = 0;
    const trials = 10;
    for (let i = 0; i < trials; i++) {
        const res = simulateNextYearPhysics(testState);
        if (!res.gameOverReason) survived++;
    }
    console.log(`Immediate 1-Year Survival Rate of chosen strategy: ${survived}/${trials}`);
}

// Scenario: Year 20, Wealth 5 Cr (Finished accumulation, just need to survive 10 years)
const wealthyState: GameState = {
    currentYear: 20,
    startYear: 2024,
    maxYears: 30,
    buckets: [
        { type: 'Cash', name: 'Cash', balance: 5000000, lastYearReturn: 0 },
        { type: 'Income', name: 'Income', balance: 15000000, lastYearReturn: 0 },
        { type: 'Growth', name: 'Growth', balance: 30000000, lastYearReturn: 0 }
    ],
    history: [],
    config: mockConfig,
    isGameOver: false,
    sessionId: 'test-wealthy'
};

async function run() {
    await debugOptimizer("Healthy Start (Year 1, 5Cr)", healthyState);
    await debugOptimizer("Crisis Mode (Year 5, 2Cr)", crisisState);
    await debugOptimizer("Wealthy/Late Game (Year 20, 5Cr)", wealthyState);
}

run();
