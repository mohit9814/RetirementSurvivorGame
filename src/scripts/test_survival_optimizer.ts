
import { SurvivalOptimizer } from '../engine/OptimizationEngine';
import { GameState, GameConfig } from '../types';

const mockConfig: GameConfig = {
    initialCorpus: 10000000,
    initialExpenses: 400000,
    inflationRate: 0.07,
    survivalYears: 30,
    enableTaxation: true,
    rebalancingStrategy: 'AI_Max_Survival',
    bucketConfigs: [
        { type: 'Cash', name: 'Cash', allocation: 0.1, expectedReturn: 0.04, volatility: 0.01 },
        { type: 'Income', name: 'Income', allocation: 0.5, expectedReturn: 0.07, volatility: 0.05 },
        { type: 'Growth', name: 'Growth', allocation: 0.4, expectedReturn: 0.12, volatility: 0.15 }
    ]
};

const mockState: GameState = {
    currentYear: 0,
    startYear: 2024,
    maxYears: 30,
    buckets: [
        { type: 'Cash', name: 'Cash', balance: 1000000, lastYearReturn: 0 },
        { type: 'Income', name: 'Income', balance: 5000000, lastYearReturn: 0 },
        { type: 'Growth', name: 'Growth', balance: 4000000, lastYearReturn: 0 }
    ],
    history: [],
    config: mockConfig,
    isGameOver: false,
    sessionId: 'test'
};

console.log("Running Survival Optimizer Test...");
const startTime = Date.now();
const optimalAlloc = SurvivalOptimizer.findOptimalAllocation(mockState, 20); // Low N for speed check
const endTime = Date.now();

console.log("Optimization Completed in", endTime - startTime, "ms");
console.log("Optimal Allocation:", optimalAlloc);

if (optimalAlloc.length === 3 && optimalAlloc.reduce((a, b) => a + b, 0) > 0.99) {
    console.log("SUCCESS: Optimizer returned valid allocation.");
} else {
    console.error("FAILURE: Invalid allocation returned.");
    process.exit(1);
}
