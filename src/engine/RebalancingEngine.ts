import type { GameState, BucketState } from '../types';

export function applyRebalancing(state: GameState): GameState {
    const strategy = state.config.rebalancingStrategy;
    console.log(`[RebalancingEngine] Applying Strategy: ${strategy} | Year: ${state.currentYear}`);

    if (!strategy || strategy === 'None') return state;

    let newBuckets = JSON.parse(JSON.stringify(state.buckets)) as BucketState[];
    const totalWealth = newBuckets.reduce((sum, b) => sum + b.balance, 0);

    // Track moves for Genie and Logging
    const moves: any[] = [];
    const logMove = (from: number, to: number, amount: number, reason: string) => {
        if (amount > 0.1) {
            // Visualize Tax: Assume 10% LTCG on 50% of the withdrawal amount for Growth/Income buckets
            // This is a "visual" tax to show impact, not a double-deduction from corpus (simplified model uses annual expense buffer)
            const tax = (from === 2 || from === 1) ? amount * 0.5 * 0.10 : 0;

            console.log(`[Rebalancing] ${reason}: Moving ${amount.toFixed(2)} from B${from + 1} to B${to + 1} (Est Tax: ${tax.toFixed(2)})`);
            moves.push({
                year: state.currentYear,
                fromBucketIndex: from,
                toBucketIndex: to,
                amount,
                reason,
                taxIncurred: tax > 0 ? tax : undefined
            });
        }
    };

    if (strategy === 'RefillBucket1') {
        const nextYear = state.currentYear + 1;
        const inflationMultiplier = Math.pow(1 + state.config.inflationRate, nextYear);
        const annualExpense = state.config.initialExpenses * inflationMultiplier;
        const targetB1 = annualExpense * 2;

        if (newBuckets[0].balance < targetB1) {
            let deficit = targetB1 - newBuckets[0].balance;

            // Try Bucket 2 (Income)
            if (newBuckets[1].balance > 0) {
                const take = Math.min(newBuckets[1].balance, deficit);
                newBuckets[1].balance -= take;
                newBuckets[0].balance += take;
                deficit -= take;
                logMove(1, 0, take, 'Safety Refill');
            }

            // If still deficit, try Bucket 3 (Growth)
            if (deficit > 0 && newBuckets[2].balance > 0) {
                const take = Math.min(newBuckets[2].balance, deficit);
                newBuckets[2].balance -= take;
                newBuckets[0].balance += take;
                logMove(2, 0, take, 'Safety Refill');
            }
        }
    } else if (strategy === 'Tactical') {
        const tacticalYears = state.config.tacticalCashBufferYears || 3; // Optimized default: 3 years

        // 1. Safety Rule: Ensure B1 has X years of expenses
        const nextYear = state.currentYear + 1;
        const inflationMultiplier = Math.pow(1 + state.config.inflationRate, nextYear);
        const annualExpense = state.config.initialExpenses * inflationMultiplier;
        const targetB1 = annualExpense * tacticalYears;
        const maxB1 = targetB1 * 1.5; // If B1 holds > 1.5x target, deploy it!
        console.log(`[Tactical Check] Year: ${state.currentYear} | Expense: ${annualExpense.toFixed(0)} | Target B1 (${tacticalYears}y): ${targetB1.toFixed(0)} | Max B1: ${maxB1.toFixed(0)} | Current B1: ${newBuckets[0].balance.toFixed(0)}`);

        if (newBuckets[0].balance < targetB1) {
            let deficit = targetB1 - newBuckets[0].balance;
            // From B2
            if (newBuckets[1].balance > 0) {
                const take = Math.min(newBuckets[1].balance, deficit);
                newBuckets[1].balance -= take;
                newBuckets[0].balance += take;
                deficit -= take;
                logMove(1, 0, take, 'Safety Refill');
            }
            // From B3
            if (deficit > 0 && newBuckets[2].balance > 0) {
                const take = Math.min(newBuckets[2].balance, deficit);
                newBuckets[2].balance -= take;
                newBuckets[0].balance += take;
                logMove(2, 0, take, 'Safety Refill');
            }
        }
        // 1b. OPPORTUNITY RULE: Deploy Excess Cash (B1 -> B2)
        else if (newBuckets[0].balance > maxB1) {
            const excess = newBuckets[0].balance - targetB1; // Keep target, deploy rest
            newBuckets[0].balance -= excess;
            newBuckets[1].balance += excess;
            logMove(0, 1, excess, 'Deploying Idle Cash');
        }

        // 2. Profit Taking & Buy Low Rules
        const prevHistory = state.history[state.history.length - 1];

        if (prevHistory) {
            const currentTotal = newBuckets.reduce((s, b) => s + b.balance, 0);

            // --- BUCKET 3 (GROWTH) LOGIC ---
            const b3Conf = state.config.bucketConfigs[2];

            // TACTICAL GLIDE PATH: Reduce target equity allocation by 0.5% per year to de-risk
            // Default Start: 60% (from config). Year 30: 45%.
            const glidePathDecay = state.currentYear * 0.005;
            const tacticalTargetAlloc = Math.max(0.30, b3Conf.allocation - glidePathDecay);

            const b3CurrentAlloc = newBuckets[2].balance / currentTotal;
            const b3Ret = newBuckets[2].lastYearReturn;

            // A. Profit Skimming: Beating Exp AND Overweight (Relative to NEW Dynamic Target)
            if (b3Ret > b3Conf.expectedReturn && b3CurrentAlloc > tacticalTargetAlloc) {
                const excessRate = b3Ret - b3Conf.expectedReturn;
                const skimAmount = Math.max(0, newBuckets[2].balance * excessRate);
                newBuckets[2].balance -= skimAmount;
                newBuckets[1].balance += skimAmount;
                logMove(2, 1, skimAmount, 'Profit Skimming');
            }
            // B. Buy Low: Below Exp AND Underweight (Relative to NEW Dynamic Target)
            else if (b3Ret < b3Conf.expectedReturn && b3CurrentAlloc < tacticalTargetAlloc) {
                const missingRate = b3Conf.expectedReturn - b3Ret;
                if (newBuckets[1].balance > 0) {
                    // Deploy up to 20% of B2 or match the missing return
                    const buyAmount = Math.min(newBuckets[1].balance * 0.2, newBuckets[2].balance * missingRate);
                    newBuckets[1].balance -= buyAmount;
                    newBuckets[2].balance += buyAmount;
                    logMove(1, 2, buyAmount, 'Buy Low Opportunity');
                }
            }
            // C. GLIDE PATH ENFORCEMENT: If Equity is WAY above target (>10% deviation), trim it regardless of return
            // This ensures the Glide Path is respected even in "normal" market years
            else if (b3CurrentAlloc > (tacticalTargetAlloc + 0.05)) {
                const excessAmt = (b3CurrentAlloc - tacticalTargetAlloc) * currentTotal;
                const trimAmt = excessAmt * 0.5; // Smooth trim (50% of excess)
                newBuckets[2].balance -= trimAmt;
                newBuckets[1].balance += trimAmt;
                logMove(2, 1, trimAmt, 'Glide Path Adjustment');
            }

            // --- BUCKET 2 (INCOME) LOGIC ---
            const b2Conf = state.config.bucketConfigs[1];
            const b2CurrentAlloc = newBuckets[1].balance / currentTotal;
            const b2Ret = newBuckets[1].lastYearReturn;

            // A. Profit Taking: Beating Exp AND Overweight
            if (b2Ret > b2Conf.expectedReturn && b2CurrentAlloc > b2Conf.allocation) {
                const excessRate = b2Ret - b2Conf.expectedReturn;
                const skimAmount = Math.max(0, newBuckets[1].balance * excessRate);
                newBuckets[1].balance -= skimAmount;
                newBuckets[0].balance += skimAmount;
                logMove(1, 0, skimAmount, 'Profit Skimming');
            }
        }

    } else if (strategy === 'GlidePath') {
        const startEquity = 0.90;
        const endEquity = 0.50;
        const duration = 50;
        const slope = (startEquity - endEquity) / duration;

        let targetEquity = startEquity - (state.currentYear * slope);
        if (targetEquity < endEquity) targetEquity = endEquity;

        // Use totalWealth from line 10
        const targetB3Amount = totalWealth * targetEquity;
        const currentB3 = newBuckets[2].balance;
        const diff = currentB3 - targetB3Amount;

        // 1. Rebalance Equity
        if (diff > 0) { // Too much equity -> Move to Safe
            newBuckets[2].balance -= diff;
            newBuckets[1].balance += diff;
            logMove(2, 1, diff, `Glide Path Adjustment (${(targetEquity * 100).toFixed(1)}%)`);
        } else if (diff < 0) { // Too little equity -> Buy from Safe
            const shortfall = Math.abs(diff);
            // Use B2 first
            if (newBuckets[1].balance > shortfall) {
                newBuckets[1].balance -= shortfall;
                newBuckets[2].balance += shortfall;
                logMove(1, 2, shortfall, `Glide Path Rebalance Up`);
            }
        }

        // 2. Safety Floor (Ensure B1 has 1 year expenses)
        const nextYear = state.currentYear + 1;
        const inflationMultiplier = Math.pow(1 + state.config.inflationRate, nextYear);
        const annualExpense = state.config.initialExpenses * inflationMultiplier;

        if (newBuckets[0].balance < annualExpense) {
            const deficit = annualExpense - newBuckets[0].balance;
            // Try B2 first
            if (newBuckets[1].balance > deficit) {
                newBuckets[1].balance -= deficit;
                newBuckets[0].balance += deficit;
                logMove(1, 0, deficit, 'Safety Top-up');
            }
        }

    } else if (strategy === 'FixedAllocation') {
        state.config.bucketConfigs.forEach((conf, i) => {
            const target = totalWealth * conf.allocation;
            newBuckets[i].balance = target;
        });
    }

    // Attach moves to the latest history item
    let newHistory = [...state.history];
    if (newHistory.length > 0) {
        const lastIdx = newHistory.length - 1;
        newHistory[lastIdx] = {
            ...newHistory[lastIdx],
            buckets: JSON.parse(JSON.stringify(newBuckets)), // Update history with POST-REBALANCE buckets
            rebalancingMoves: moves.length > 0 ? moves : undefined
        };
    }

    return {
        ...state,
        buckets: newBuckets,
        history: [...state.history.slice(0, -1), { ...state.history[state.history.length - 1], rebalancingMoves: moves }]
    };
}
