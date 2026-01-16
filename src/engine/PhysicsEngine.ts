import type { GameState } from '../types';
import { simulateYearlyReturn } from './MarketEngine';
import { calculateNewRegimeTax, calculateLTCG } from '../utils/tax';

/**
 * Pure physics of a single year: Market -> Tax -> Withdrawal
 * Used by GameEngine and OptimizationEngine (for Monte Carlo)
 */
export function simulateNextYearPhysics(
    currentState: GameState,
    expensesOverride?: number,
    fixedReturns?: number[]
) {
    const nextYear = currentState.currentYear + 1;
    const inflationMultiplier = Math.pow(1 + currentState.config.inflationRate, nextYear);
    const currentExpenses = (expensesOverride || currentState.config.initialExpenses) * inflationMultiplier;

    // 1. Simulate Market Returns & Calculate Gross Income
    let totalIncomeGain = 0; // For Bucket 1 & 2
    let totalLtcgGain = 0;   // For Bucket 3
    let bucketWiseGains: number[] = [];
    const generatedReturns: number[] = [];

    const bucketsAfterReturn = currentState.buckets.map((bucket, index) => {
        const config = currentState.config.bucketConfigs[index];
        // Use fixed return if available (for shadow sims), otherwise generate random
        const yearlyReturnRate = fixedReturns ? fixedReturns[index] : simulateYearlyReturn(config.expectedReturn, config.volatility);

        generatedReturns.push(yearlyReturnRate);

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
    // Flexible Spending Experiment: Cut expenses if Growth bucket tanks.
    const growthRet = bucketsAfterReturn[2].lastYearReturn;
    let flexCut = 0;
    if (growthRet < -0.15) flexCut = 0.15;       // >15% Drop -> 15% Cut
    else if (growthRet < -0.10) flexCut = 0.10;  // >10% Drop -> 10% Cut
    else if (growthRet < 0) flexCut = 0.05;      // Any Drop  -> 5% Cut

    if (flexCut > 0) {
        // console.log(`[Physics] Market Down (${(growthRet*100).toFixed(1)}%), cutting expenses by ${(flexCut*100).toFixed(0)}%`);
    }

    let pendingExpenses = currentExpenses * (1 - flexCut);
    let gameOverReason: string | undefined = undefined;

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

    return {
        buckets: bucketsAfterReturn,
        totalWealth,
        expensesPaid: currentExpenses - pendingExpenses,
        inflationMultiplier,
        portfolioReturn,
        totalTax,
        gameOverReason,
        generatedReturns
    };
}
