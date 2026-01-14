import type { GameState, BucketState, YearlyResult, GameConfig } from '../types';
import { simulateYearlyReturn, getMarketEventDescription } from './MarketEngine';
import { calculateNewRegimeTax, calculateLTCG } from '../utils/tax';
import { applyRebalancing } from './RebalancingEngine';

console.log("DEBUG: GameEngine.ts evaluating");

export const INITIAL_CONFIG: GameConfig = {
    initialCorpus: 50000000, // 5 Crores
    initialExpenses: 1200000, // 12 Lakhs
    inflationRate: 0.07,
    survivalYears: 30, // Default 30 years
    enableTaxation: true, // Default Enabled
    rebalancingStrategy: 'None',
    bucketConfigs: [
        { name: 'Bucket 1 (Cash/Liquid)', type: 'Cash', allocation: 0.1, expectedReturn: 0.04, volatility: 0.01 },
        { name: 'Bucket 2 (Income)', type: 'Income', allocation: 0.3, expectedReturn: 0.08, volatility: 0.08 },
        { name: 'Bucket 3 (Equity)', type: 'Growth', allocation: 0.6, expectedReturn: 0.12, volatility: 0.15 },
    ]
};

export function initializeGame(config: GameConfig = INITIAL_CONFIG): GameState {
    const buckets: BucketState[] = config.bucketConfigs.map(b => ({
        type: b.type,
        name: b.name,
        balance: config.initialCorpus * b.allocation,
        lastYearReturn: 0
    }));

    return {
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
        sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique Session ID
    };
}

export function advanceYear(currentState: GameState, expensesOverride?: number): GameState {
    if (currentState.isGameOver) return currentState;

    const nextYear = currentState.currentYear + 1;

    // DEBUG LOG
    console.log(`--- YEAR ${nextYear} START ---`);
    console.log("Current Wealth:", currentState.buckets.reduce((s, b) => s + b.balance, 0));
    currentState.buckets.forEach(b => console.log(`${b.name}: ${b.balance}`));

    // 1. Calculate Inflation & Expenses
    // ... (existing variable declarations) ...
    const inflationMultiplier = Math.pow(1 + currentState.config.inflationRate, nextYear);
    const currentExpenses = (expensesOverride || currentState.config.initialExpenses) * inflationMultiplier;

    // 1. Simulate Market Returns & Calculate Gross Income
    let totalIncomeGain = 0; // For Bucket 1 & 2
    let totalLtcgGain = 0;   // For Bucket 3
    let bucketWiseGains: number[] = [];

    const bucketsAfterReturn = currentState.buckets.map((bucket, index) => {
        const config = currentState.config.bucketConfigs[index];
        const yearlyReturnRate = simulateYearlyReturn(config.expectedReturn, config.volatility);

        // Apply return to STARTING balance
        const gain = bucket.balance * yearlyReturnRate;
        const newBalance = bucket.balance + gain;

        bucketWiseGains.push(gain);

        if (bucket.type === 'Cash' || bucket.type === 'Income') {
            if (gain > 0) totalIncomeGain += gain;
        } else if (bucket.type === 'Growth') {
            if (gain > 0) totalLtcgGain += gain;
        }

        return {
            ...bucket,
            balance: newBalance,
            lastYearReturn: yearlyReturnRate
        };
    });

    // 2. Calculate Taxes (if enabled)
    let incomeTax = 0;
    let ltcgTax = 0;

    if (currentState.config.enableTaxation) {
        incomeTax = calculateNewRegimeTax(totalIncomeGain);
        ltcgTax = calculateLTCG(totalLtcgGain);
    }

    const totalTax = incomeTax + ltcgTax;

    // 3. Deduct Taxes
    if (incomeTax > 0) {
        if (bucketsAfterReturn[1].balance >= incomeTax) {
            bucketsAfterReturn[1].balance -= incomeTax;
        } else {
            const remainder = incomeTax - bucketsAfterReturn[1].balance;
            bucketsAfterReturn[1].balance = 0;
            bucketsAfterReturn[0].balance -= remainder;
        }
    }

    if (ltcgTax > 0) {
        bucketsAfterReturn[2].balance -= ltcgTax;
    }

    // 4. Withdraw Expenses
    let pendingExpenses = currentExpenses;
    let gameOverReason = undefined;

    if (bucketsAfterReturn[0].balance >= pendingExpenses) {
        bucketsAfterReturn[0].balance -= pendingExpenses;
        pendingExpenses = 0;
    } else {
        // Bucket 1 empty, try Emergency Refill from B2 then B3
        pendingExpenses -= bucketsAfterReturn[0].balance;
        bucketsAfterReturn[0].balance = 0;

        // Try Bucket 2
        if (bucketsAfterReturn[1].balance >= pendingExpenses) {
            bucketsAfterReturn[1].balance -= pendingExpenses;
            pendingExpenses = 0;
        } else {
            pendingExpenses -= bucketsAfterReturn[1].balance;
            bucketsAfterReturn[1].balance = 0;
        }

        // Try Bucket 3
        if (pendingExpenses > 0) {
            if (bucketsAfterReturn[2].balance >= pendingExpenses) {
                bucketsAfterReturn[2].balance -= pendingExpenses;
                pendingExpenses = 0;
            } else {
                pendingExpenses -= bucketsAfterReturn[2].balance;
                bucketsAfterReturn[2].balance = 0;
            }
        }

        if (pendingExpenses > 0) {
            gameOverReason = "Bankruptcy! Total Portfolio Depleted.";
        }
    }

    const totalWealth = bucketsAfterReturn.reduce((sum, b) => sum + b.balance, 0);

    // Calculate Portfolio Return
    const previousWealth = currentState.buckets.reduce((sum, b) => sum + b.balance, 0);
    const totalGains = bucketWiseGains.reduce((sum, g) => sum + g, 0);
    const portfolioReturn = previousWealth > 0 ? totalGains / previousWealth : 0;

    // Check Victory (Survival Duration Met)
    // We check if nextYear reached the target
    if (!gameOverReason && nextYear >= currentState.config.survivalYears && totalWealth > 0) {
        gameOverReason = `Victory! You survived ${currentState.config.survivalYears} years.`;
    }

    // Check Global Bankruptcy
    if (totalWealth <= 0) {
        gameOverReason = "Bankruptcy! Total Portfolio Depleted.";
    }

    const marketEvent = getMarketEventDescription(bucketsAfterReturn[2].lastYearReturn);

    const newHistoryItem: YearlyResult = {
        year: nextYear,
        buckets: JSON.parse(JSON.stringify(bucketsAfterReturn)),
        totalWealth,
        withdrawn: currentExpenses - pendingExpenses,
        inflation: inflationMultiplier,
        portfolioReturn,
        taxPaid: totalTax,
        marketEvent
    };

    // 5. Apply Rebalancing Logic
    // We create a temporary state to pass to the engine, then extract the buckets
    const intermediateState: GameState = {
        ...currentState,
        currentYear: nextYear,
        buckets: bucketsAfterReturn,
        history: [...currentState.history, newHistoryItem],
        isGameOver: !!gameOverReason,
        gameOverReason,
        config: currentState.config // Pass config for strategy check
    };

    // Only rebalance if game is NOT over
    const finalState = !gameOverReason ? applyRebalancing(intermediateState) : intermediateState;

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
