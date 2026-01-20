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
    // Strategy Update: "Whenever there are below average returns in bucket 2 or bucket 3, please do not inflate the withdrawals for that year"
    const b2Ret = bucketsAfterReturn[1].lastYearReturn;
    const b3Ret = bucketsAfterReturn[2].lastYearReturn;

    // Check against Expected Returns from Config (Weighted Approach)
    // Old Logic: (B2 < Exp || B3 < Exp) -> Too aggressive.
    // New Logic: Check if Combined Investment Performance (B2+B3) is below Combined Expectation.
    // This allows a Boom in B3 to carry a Lag in B2, and vice versa.

    const b1Start = currentState.buckets[0].balance;
    const b2Start = currentState.buckets[1].balance;
    const b3Start = currentState.buckets[2].balance;

    // We strictly look at B2 and B3 for "Portfolio Performance" signal
    const b2ActualGain = b2Start * b2Ret;
    const b3ActualGain = b3Start * b3Ret;
    const totalActualGain = b2ActualGain + b3ActualGain;

    // Check against Expected Returns from Config
    const b2Exp = currentState.config.bucketConfigs[1].expectedReturn;
    const b3Exp = currentState.config.bucketConfigs[2].expectedReturn;

    const b2ExpectedGain = b2Start * b2Exp;
    const b3ExpectedGain = b3Start * b3Exp;
    const totalExpectedGain = b2ExpectedGain + b3ExpectedGain;

    let adjustedExpenses = currentExpenses;

    // Only cut spending if the TOTAL weighted gain is less than expected
    // AND the total portfolio return wasn't massive (e.g. if we made > 12% overall, don't cut regardless of expectation)
    const portfolioSimpleReturn = (b1Start + b2Start + b3Start) > 0 ? (totalActualGain + (b1Start * bucketsAfterReturn[0].lastYearReturn)) / (b1Start + b2Start + b3Start) : 0;

    // Check for "Austerity Fatigue": Max 2 consecutive years of cuts allowed.
    let consecutiveSkips = 0;
    for (let i = currentState.history.length - 1; i >= 0; i--) {
        if (currentState.history[i].spendingCutApplied) consecutiveSkips++;
        else break;
    }

    if (consecutiveSkips < 2 && totalActualGain < totalExpectedGain && portfolioSimpleReturn < 0.12) {
        // Remove THIS year's inflation (Stay nominal)
        adjustedExpenses = currentExpenses / (1 + currentState.config.inflationRate);
        // console.log(`[Physics] Performance Lag (Act: ${(totalActualGain/100000).toFixed(2)}L vs Exp: ${(totalExpectedGain/100000).toFixed(2)}L). Skipping Inflation.`);
    }

    // Flexible Spending Experiment: Cut expenses if Growth bucket tanks.
    const growthRet = bucketsAfterReturn[2].lastYearReturn;
    let flexCut = 0;
    if (growthRet < -0.15) flexCut = 0.15;       // >15% Drop -> 15% Cut
    else if (growthRet < -0.10) flexCut = 0.10;  // >10% Drop -> 10% Cut
    else if (growthRet < 0) flexCut = 0.05;      // Any Drop  -> 5% Cut

    if (flexCut > 0) {
        // console.log(`[Physics] Market Down (${(growthRet*100).toFixed(1)}%), cutting expenses by ${(flexCut*100).toFixed(0)}%`);
    }

    // Apply cuts to the POSSIBLY non-inflated amount
    let pendingExpenses = adjustedExpenses * (1 - flexCut);
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
        expensesPaid: adjustedExpenses - pendingExpenses,
        inflationMultiplier,
        portfolioReturn,
        totalTax,
        gameOverReason,
        generatedReturns,
        spendingCutApplied: adjustedExpenses < currentExpenses
    };
}
