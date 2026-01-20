import type { GameState, BucketState, GameConfig } from '../types';
import { getMarketEventDescription } from './MarketEngine';
import { applyRebalancing } from './RebalancingEngine';
import { simulateNextYearPhysics } from './PhysicsEngine';

console.log("DEBUG: GameEngine.ts evaluating");

export const INITIAL_CONFIG: GameConfig = {
    initialCorpus: 50000000, // 5 Crores
    initialExpenses: 1200000, // 12 Lakhs
    inflationRate: 0.07,
    survivalYears: 45, // Default 30 years
    enableTaxation: true, // Default Enabled
    rebalancingStrategy: 'None',
    bucketConfigs: [
        { name: 'Bucket 1 (Cash/Liquid)', type: 'Cash', allocation: 0.10, expectedReturn: 0.05, volatility: 0.06 },
        { name: 'Bucket 2 (Income)', type: 'Income', allocation: 0.25, expectedReturn: 0.092, volatility: 0.078 },
        { name: 'Bucket 3 (Equity)', type: 'Growth', allocation: 0.65, expectedReturn: 0.136, volatility: 0.161 },
    ]
};

export function initializeGame(config: GameConfig = INITIAL_CONFIG): GameState {
    const buckets: BucketState[] = config.bucketConfigs.map(b => ({
        type: b.type,
        name: b.name,
        balance: config.initialCorpus * b.allocation,
        lastYearReturn: 0
    }));

    const initialState: GameState = {
        currentYear: 0,
        startYear: new Date().getFullYear(),
        maxYears: config.survivalYears,
        buckets,
        history: [{
            year: 0,
            buckets: JSON.parse(JSON.stringify(buckets)),
            totalWealth: config.initialCorpus,
            withdrawn: 0,
            inflation: 0,
            portfolioReturn: 0,
            taxPaid: 0
        }],
        config,
        isGameOver: false,
        sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    // Initialize Shadow Strategies (GOD Mode)
    // We create parallel universes for specific strategies to compare against
    const strategiesToCompare = ['RefillBucket1', 'GlidePath', 'FixedAllocation', 'AI_Max_Survival', 'Tactical'];
    const shadows: Record<string, GameState> = {};

    strategiesToCompare.forEach(strat => {
        if (strat === config.rebalancingStrategy) return; // Don't shadow self

        shadows[strat] = {
            ...JSON.parse(JSON.stringify(initialState)),
            config: {
                ...config,
                rebalancingStrategy: strat as any
            }
        };
    });

    initialState.shadowStrategies = shadows;
    return initialState;
}

export function advanceYear(currentState: GameState, expensesOverride?: number): GameState {
    if (currentState.isGameOver) return currentState;

    const nextYear = currentState.currentYear + 1;

    // DEBUG LOG
    console.log(`--- YEAR ${nextYear} START ---`);
    console.log("Current Wealth:", currentState.buckets.reduce((s, b) => s + b.balance, 0));
    currentState.buckets.forEach(b => console.log(`${b.name}: ${b.balance}`));

    // 1. Run Main Physics Simulation (Generates Market Returns)
    const physicsResult = simulateNextYearPhysics(currentState, expensesOverride);

    // 2. Advance Shadow Strategies (Using SAME Market Returns)
    const nextShadows: Record<string, GameState> = {};
    if (currentState.shadowStrategies) {
        Object.entries(currentState.shadowStrategies).forEach(([stratName, shadowState]) => {
            if (shadowState.isGameOver) {
                nextShadows[stratName] = shadowState;
                return;
            }

            // Sync Shadow Expenses (assuming same override applies)
            // Note: Shadow doesn't have UI override access usually, so we pass same.

            // Run Physics with FIXED returns
            const shadowPhysics = simulateNextYearPhysics(shadowState, expensesOverride, physicsResult.generatedReturns);

            const intermediateShadow: GameState = {
                ...shadowState,
                currentYear: nextYear,
                buckets: shadowPhysics.buckets,
                history: [...shadowState.history, {
                    year: nextYear,
                    buckets: JSON.parse(JSON.stringify(shadowPhysics.buckets)),
                    totalWealth: shadowPhysics.totalWealth,
                    withdrawn: shadowPhysics.expensesPaid,
                    inflation: shadowPhysics.inflationMultiplier,
                    portfolioReturn: shadowPhysics.portfolioReturn,
                    taxPaid: shadowPhysics.totalTax,
                    marketEvent: getMarketEventDescription(shadowPhysics.buckets[2].lastYearReturn)
                }],
                isGameOver: !!shadowPhysics.gameOverReason,
                gameOverReason: shadowPhysics.gameOverReason,
                config: shadowState.config
            };

            // Apply Rebalancing for Shadow
            nextShadows[stratName] = !shadowPhysics.gameOverReason ? applyRebalancing(intermediateShadow) : intermediateShadow;
        });
    }

    // 3. Apply Rebalancing Logic for Main State
    const intermediateState: GameState = {
        ...currentState,
        currentYear: nextYear,
        buckets: physicsResult.buckets,
        history: [...currentState.history, {
            year: nextYear,
            buckets: JSON.parse(JSON.stringify(physicsResult.buckets)),
            totalWealth: physicsResult.totalWealth,
            withdrawn: physicsResult.expensesPaid,
            inflation: physicsResult.inflationMultiplier,
            portfolioReturn: physicsResult.portfolioReturn,
            taxPaid: physicsResult.totalTax,
            marketEvent: getMarketEventDescription(physicsResult.buckets[2].lastYearReturn),
            spendingCutApplied: physicsResult.spendingCutApplied
        }],
        isGameOver: !!physicsResult.gameOverReason,
        gameOverReason: physicsResult.gameOverReason,
        config: currentState.config
    };

    const finalState = !physicsResult.gameOverReason ? applyRebalancing(intermediateState) : intermediateState;

    // Attach evolved shadows
    finalState.shadowStrategies = nextShadows;

    return finalState;
}

export function transferFunds(state: GameState, fromIndex: number, toIndex: number, amount: number): GameState {
    if (amount <= 0) return state;
    if (state.buckets[fromIndex].balance < amount) {
        // Cannot transfer more than available
        return state;
    }

    const newBuckets = [...state.buckets];
    newBuckets[fromIndex] = { ...newBuckets[fromIndex], balance: newBuckets[fromIndex].balance - amount };
    newBuckets[toIndex] = { ...newBuckets[toIndex], balance: newBuckets[toIndex].balance + amount };

    return {
        ...state,
        buckets: newBuckets
    };
}
