
// optimize_standalone.ts
// Fully self-contained Monte Carlo Simulation for Optimization

// ---------------------- TYPES ----------------------
type BucketType = 'Cash' | 'Income' | 'Growth';

interface BucketConfig {
    type: BucketType;
    name: string;
    expectedReturn: number;
    volatility: number;
    allocation: number;
}

interface BucketState {
    type: BucketType;
    name: string;
    balance: number;
    lastYearReturn: number;
}

interface YearlyResult {
    year: number;
    buckets: BucketState[];
    totalWealth: number;
    withdrawn: number;
    inflation: number;
    portfolioReturn: number;
    taxPaid: number;
    rebalancingMoves?: any[];
}

interface GameConfig {
    initialCorpus: number;
    initialExpenses: number;
    inflationRate: number;
    survivalYears: number;
    enableTaxation: boolean;
    rebalancingStrategy: string;
    tacticalCashBufferYears?: number;
    bucketConfigs: BucketConfig[];
}

interface GameState {
    currentYear: number;
    maxYears: number;
    buckets: BucketState[];
    history: YearlyResult[];
    config: GameConfig;
    isGameOver: boolean;
}

// ---------------------- UTILS: MATH & TAX ----------------------
function generateNormalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z * stdDev + mean;
}

function simulateYearlyReturn(expectedReturn: number, volatility: number): number {
    if (volatility === 0) return expectedReturn;
    return generateNormalRandom(expectedReturn, volatility);
}

function calculateNewRegimeTax(grossIncome: number): number {
    const standardDeduction = 75000;
    const income = Math.max(0, grossIncome - standardDeduction);
    if (income <= 1200000) return 0;

    let tax = 0;
    if (income > 400000) tax += (Math.min(income, 800000) - 400000) * 0.05;
    if (income > 800000) tax += (Math.min(income, 1200000) - 800000) * 0.10;
    if (income > 1200000) tax += (Math.min(income, 1600000) - 1200000) * 0.15;
    if (income > 1600000) tax += (Math.min(income, 2000000) - 1600000) * 0.20;
    if (income > 2000000) tax += (Math.min(income, 2400000) - 2000000) * 0.25;
    if (income > 2400000) tax += (income - 2400000) * 0.30;
    return tax * 1.04; // Cess
}

function calculateLTCG(gain: number): number {
    const exemption = 125000;
    if (gain <= exemption) return 0;
    return (gain - exemption) * 0.125;
}

// ---------------------- ENGINE LOGIC ----------------------
function initializeGame(config: GameConfig): GameState {
    const buckets: BucketState[] = config.bucketConfigs.map(b => ({
        type: b.type,
        name: b.name,
        balance: config.initialCorpus * b.allocation,
        lastYearReturn: 0
    }));

    return {
        currentYear: 0,
        maxYears: config.survivalYears,
        buckets,
        history: [{
            year: 0, buckets: JSON.parse(JSON.stringify(buckets)),
            totalWealth: config.initialCorpus, withdrawn: 0, inflation: 0, portfolioReturn: 0, taxPaid: 0
        }],
        config,
        isGameOver: false
    };
}

function advanceYear(currentState: GameState): GameState {
    if (currentState.isGameOver) return currentState;
    const nextYear = currentState.currentYear + 1;
    const inflationMultiplier = Math.pow(1 + currentState.config.inflationRate, nextYear);
    const currentExpenses = currentState.config.initialExpenses * inflationMultiplier;

    // 1. Market Returns
    let totalIncomeGain = 0;
    let totalLtcgGain = 0;
    const buckets = currentState.buckets.map((bucket, index) => {
        const conf = currentState.config.bucketConfigs[index];
        const rate = simulateYearlyReturn(conf.expectedReturn, conf.volatility);
        const gain = bucket.balance * rate;
        const newBal = bucket.balance + gain;

        if (gain > 0) {
            if (bucket.type === 'Cash' || bucket.type === 'Income') totalIncomeGain += gain;
            else if (bucket.type === 'Growth') totalLtcgGain += gain;
        }
        return { ...bucket, balance: newBal, lastYearReturn: rate };
    });

    // 2. Withdraw Expenses
    // FIX: Removing Unrealized Gains Tax. Only tax withdrawals.
    // Approximating Tax as 10% surcharge on Expenses (Blended LTCG/Slab)
    const estimatedTax = currentExpenses * 0.10;
    let remainingExpense = currentExpenses + estimatedTax;

    // const tax = calculateNewRegimeTax(totalIncomeGain) + calculateLTCG(totalLtcgGain);
    // remainingExpense += tax; 

    // Withdraw Order: B1 -> B2 -> B3
    for (let i = 0; i < buckets.length; i++) {
        if (remainingExpense <= 0) break;
        const take = Math.min(buckets[i].balance, remainingExpense);
        buckets[i].balance -= take;
        remainingExpense -= take;
    }

    if (remainingExpense > 100) { // Tolerance
        return { ...currentState, buckets, currentYear: nextYear, isGameOver: true };
    }

    // 3. Update History
    const totalWealth = buckets.reduce((s, b) => s + b.balance, 0);
    const prevWealth = currentState.buckets.reduce((s, b) => s + b.balance, 0); // Fix: Use current state buckets directly
    const portReturn = (totalWealth + currentExpenses + estimatedTax - prevWealth) / prevWealth; // Use estimatedTax

    // DEBUG TRACE
    // Only log for the very first simulation of the batch to avoid spam
    // We can detecting this by passing a flag or just hacking it here?
    // Let's print if totalWealth < prevWealth * 0.5 (Crash) or just first 50 years of first sim.
    // Actually, `runSim` doesn't know iteration index.
    // Usage: inside runSim, we can verify.

    return {
        ...currentState,
        currentYear: nextYear,
        buckets,
        history: [...currentState.history] // Don't bloat history for optimization
    };
}

// ---------------------- GLIDE PATH LOGIC ----------------------
function applyRebalancing(state: GameState): GameState {
    const buckets = state.buckets; // FIX: Restore reference
    const strategy = state.config.rebalancingStrategy;
    const year = state.currentYear;
    const b3Conf = state.config.bucketConfigs[2];
    const totalWealth = buckets.reduce((s, b) => s + b.balance, 0); // Define totalWealth
    const b3Alloc = buckets[2].balance / totalWealth;
    const b3Ret = buckets[2].lastYearReturn;

    if (b3Ret > b3Conf.expectedReturn && b3Alloc > b3Conf.allocation) {
        const excessRate = b3Ret - b3Conf.expectedReturn;
        const skim = Math.max(0, buckets[2].balance * excessRate);
        buckets[2].balance -= skim;
        buckets[1].balance += skim;
    } else if (b3Ret < b3Conf.expectedReturn && b3Alloc < b3Conf.allocation) {
        const missing = b3Conf.expectedReturn - b3Ret;
        if (buckets[1].balance > 0) {
            const buy = Math.min(buckets[1].balance * 0.2, buckets[2].balance * missing);
            buckets[1].balance -= buy;
            buckets[2].balance += buy;
        }
    }

    // Update history
    const lastHist = state.history[state.history.length - 1];
    lastHist.buckets = JSON.parse(JSON.stringify(buckets));

    return { ...state, buckets };
}


// ---------------------- OPTIMIZATION LOOP ----------------------

const BASE_CONFIG: GameConfig = {
    initialCorpus: 45000000,
    initialExpenses: 1200000,
    inflationRate: 0.07,
    survivalYears: 50,
    enableTaxation: true,
    rebalancingStrategy: 'Tactical',
    bucketConfigs: [
        { name: 'B1', type: 'Cash', allocation: 0, expectedReturn: 0.045, volatility: 0.01 },
        { name: 'B2', type: 'Income', allocation: 0, expectedReturn: 0.0602, volatility: 0.0642 }, // Real Data: 6.02% / 6.42%
        { name: 'B3', type: 'Growth', allocation: 0, expectedReturn: 0.0839, volatility: 0.1217 }, // Real Data: 8.39% / 12.17%
    ]
};

const NUM_SIMULATIONS = 1000;

interface SimResult { year: number; wealth: number; }

function runSim(config: GameConfig): SimResult {
    let state = initializeGame(config);
    while (!state.isGameOver && state.currentYear < config.survivalYears) {
        state = advanceYear(state);
        state = applyRebalancing(state);

        // DEBUG: Trace first run logic
        // We can't easily identify "first run" here without passing an ID.
        // Let's just create a separate verify function or just modify loop?
        // Let's modify the loop in main.
    }
    const currentWealth = state.buckets.reduce((s, b) => s + b.balance, 0);
    return { year: state.currentYear, wealth: currentWealth };
}

function generateAllocations() {
    const allocs: number[][] = [];
    // Brute force B1, B2. B3 is remainder.
    for (let b1 = 5; b1 <= 20; b1 += 5) {
        for (let b2 = 10; b2 <= 60; b2 += 10) {
            const b3 = 100 - b1 - b2;
            if (b3 >= 20) { // Min 20% in Equity
                allocs.push([b1 / 100, b2 / 100, b3 / 100]);
            }
        }
    }
    return allocs;
}

console.log("Starting Optimization...");
const allocations = generateAllocations();
const tacticalOptions = [2, 3, 4, 5];

const results: any[] = [];

for (const alloc of allocations) {
    for (const tact of tacticalOptions) {
        const conf = JSON.parse(JSON.stringify(BASE_CONFIG));
        conf.bucketConfigs[0].allocation = alloc[0];
        conf.bucketConfigs[1].allocation = alloc[1];
        conf.bucketConfigs[2].allocation = alloc[2];
        conf.tacticalCashBufferYears = tact;

        const survivalPoints = [];
        const endingWealths = [];
        let successCount = 0;

        for (let i = 0; i < NUM_SIMULATIONS; i++) {
            const finalState = runSim(conf); // Returns { year, wealth }
            survivalPoints.push(finalState.year);
            if (finalState.year >= conf.survivalYears) {
                successCount++;
                endingWealths.push(finalState.wealth);
            } else {
                endingWealths.push(0);
            }
        }

        survivalPoints.sort((a, b) => a - b);
        endingWealths.sort((a, b) => a - b);

        const successRate = (successCount / NUM_SIMULATIONS) * 100;
        const medianWealth = endingWealths[Math.floor(NUM_SIMULATIONS / 2)];
        const medianYears = survivalPoints[Math.floor(NUM_SIMULATIONS / 2)];
        const worst10 = survivalPoints[Math.floor(NUM_SIMULATIONS * 0.1)];

        results.push({
            alloc: alloc.map(x => (x * 100).toFixed(0) + '%').join('/'),
            tact,
            successRate,
            medianYears, // Added
            medianWealth: (medianWealth / 10000000).toFixed(2) + ' Cr', // In Crores
            worst10
        });
    }
}

// DEBUG FUNCTION
function benchmarkStrategies() {
    console.log("--- GLIDE PATH SHOWDOWN (1000 Sims each) ---");

    const scenarios = [
        { name: 'Static High Equity (85%)', strategy: 'Static', alloc: [0.05, 0.10, 0.85] },
        { name: 'Declining Glide (90%->50%)', strategy: 'DecliningGlide', alloc: [0.05, 0.05, 0.90] }, // Start alloc
        { name: 'Rising Glide (50%->90%)', strategy: 'RisingGlide', alloc: [0.05, 0.45, 0.50] }       // Start alloc
    ];

    const results = [];

    for (const scen of scenarios) {
        let success = 0;
        const wealths: number[] = [];

        // Base config
        const config: GameConfig = {
            initialCorpus: 45000000,
            initialExpenses: 1200000,
            inflationRate: 0.07,
            survivalYears: 50,
            enableTaxation: true,
            rebalancingStrategy: scen.strategy,
            bucketConfigs: [
                { id: '1', name: 'Cash', type: 'Cash', allocation: scen.alloc[0], expectedReturn: 0.045, volatility: 0.005 },
                { id: '2', name: 'Income', type: 'Income', allocation: scen.alloc[1], expectedReturn: 0.109, volatility: 0.06 },
                { id: '3', name: 'Growth', type: 'Growth', allocation: scen.alloc[2], expectedReturn: 0.193, volatility: 0.16 }
            ]
        };

        for (let i = 0; i < 1000; i++) {
            const res = runSim(config);
            if (res.year >= 50) {
                success++;
                wealths.push(res.wealth);
            }
        }

        wealths.sort((a, b) => a - b);
        const median = wealths.length > 0 ? wealths[Math.floor(wealths.length / 2)] : 0;

        results.push({
            Strategy: scen.name,
            'Success Rate': (success / 10).toFixed(1) + '%',
            'Median Wealth (Cr)': (median / 10000000).toFixed(2)
        });
    }

    console.table(results);
}
benchmarkStrategies();

// Sort: Best Success Rate, then Best Median Wealth
results.sort((a, b) => {
    if (b.successRate !== a.successRate) return b.successRate - a.successRate;
    return parseFloat(b.medianWealth) - parseFloat(a.medianWealth);
});

console.table(results.slice(0, 10)); // Top 10
