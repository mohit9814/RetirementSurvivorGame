
import type { GameState, BucketState } from "../types";
import { simulateNextYearPhysics } from "./PhysicsEngine";

export class SurvivalOptimizer {
    /**
     * Finds the optimal allocation for the current state to maximize survival chance.
     * Uses Monte Carlo simulations.
     * 
     * @param currentState The current state of the game
     * @param simulationsPerStrategy Number of simulations to run per candidate allocation (default 50)
     * @param simulationHorizon limit how many years into future we look (default: until end of game)
     */
    static findOptimalAllocation(currentState: GameState, simulationsPerStrategy: number = 20, _simulationHorizon?: number): number[] {
        console.log(`[Optimizer] Starting Monte Carlo optimization for Year ${currentState.currentYear}`);
        const candidates = this.generateCandidateAllocations(currentState);
        let bestCandidate = candidates[0];
        let bestScore = -1;

        // Calculate Current Allocation
        const totalWealth = currentState.buckets.reduce((sum, b) => sum + b.balance, 0);
        const currentAllocation = totalWealth > 0
            ? currentState.buckets.map(b => b.balance / totalWealth)
            : [1, 0, 0]; // Default if empty

        // Include Current Allocation in candidates to allow "Do Nothing" (Status Quo bias)
        // This is critical for reducing churn.
        if (totalWealth > 0) {
            candidates.push(currentAllocation);
        }

        // Calculate Expense Requirements (Safety Floor)
        const currentExpenses = currentState.config.initialExpenses * Math.pow(1 + currentState.config.inflationRate, currentState.currentYear);
        const reqB1 = currentExpenses * 2; // 2 Years in Cash
        const reqB2 = currentExpenses * 4; // 4 Years in Income
        const totalReq = reqB1 + reqB2;

        // Generate "Safety First" Candidate (Explicitly satisfy user constraints)
        if (totalWealth > 0) {
            let safeAlloc = [0, 0, 0];
            if (totalWealth >= totalReq) {
                // Determine ratios for exact compliance
                const b1Ratio = reqB1 / totalWealth;
                const b2Ratio = reqB2 / totalWealth;
                const b3Ratio = 1 - (b1Ratio + b2Ratio);
                safeAlloc = [b1Ratio, b2Ratio, Math.max(0, b3Ratio)];
            } else {
                // Crisis: Not enough money for 2+4 years. Fill B1, then B2.
                const b1Ratio = Math.min(1, reqB1 / totalWealth);
                const remaining = 1 - b1Ratio;
                safeAlloc = [b1Ratio, remaining, 0];
            }
            candidates.push(safeAlloc);
        }

        candidates.forEach(alloc => {
            // Note: Updated signature takes 3 args: state, alloc, simCount
            // We ignore simulationHorizon for now as the new evaluateAllocation defaults to survivalYears
            const result = this.evaluateAllocation(currentState, alloc, simulationsPerStrategy, currentAllocation);

            // Score Calculation
            let score = 0;

            // Format for logging
            const allocStr = `[${(alloc[0] * 100).toFixed(1)},${(alloc[1] * 100).toFixed(1)},${(alloc[2] * 100).toFixed(0)}%]`;

            if (result.survivalRate < 0.2) {
                // Crisis Mode: Maximize time until ruin
                // Score = Survival Rate (base) + (Average Years / Total Remaining Years)
                const safeYears = currentState.config.survivalYears - currentState.currentYear;
                const durationScore = safeYears > 0 ? (result.avgSurvivalYears / safeYears) : 0;

                // Weight duration heavily if survival is near zero
                score = (result.survivalRate * 100) + (durationScore * 50);
            } else {
                // Normal Mode: Maximize Survival Chance
                score = result.survivalRate * 100;

                // Tiebreaker: Higher equity (Growth) if survival is similar
                score += alloc[2];
            }

            // ---------------------------------------------------------
            // UNIVERSAL SAFETY CONSTRAINT (Applied to ALL modes)
            // ---------------------------------------------------------

            // Loop 10: "Floors & Roofs" (The Sovereign Strategy)
            // Constraints are back, but smarter.
            if (true) {
                // Check Market State
                const growthReturn = currentState.buckets[2].lastYearReturn;
                const isCrash = growthReturn < -0.10;
                const yearsRemaining = currentState.config.survivalYears - currentState.currentYear;

                // --- FLOORS (Safety) ---
                let hardFloorB1 = currentExpenses * 1.0;
                let hardFloorB2 = currentExpenses * 2.0;

                // Crisis Relaxation
                if (isCrash) {
                    hardFloorB1 = currentExpenses * 0.5;
                    hardFloorB2 = currentExpenses * 1.0;
                }

                const projectedB1 = alloc[0] * totalWealth;
                const projectedB2 = alloc[1] * totalWealth;
                const projectedSafe = projectedB1 + projectedB2;

                // B1 Penalties (REDUCED - too harsh before)
                if (projectedB1 < hardFloorB1 * 0.99) {
                    score -= 200; // Hard Floor (was 1000)
                } else {
                    const softTargetB1 = currentExpenses * 2.0;
                    if (projectedB1 < softTargetB1) {
                        const deficit = (softTargetB1 - projectedB1) / currentExpenses;
                        score -= deficit * 5; // Soft Floor Gradient (was 20)
                    }
                }

                // B2 Penalties (REDUCED)
                if (projectedB2 < hardFloorB2 * 0.99) {
                    score -= 100; // Hard Floor (was 500)
                } else {
                    const softTargetB2 = currentExpenses * 3.0;
                    if (projectedB2 < softTargetB2) {
                        const deficit = (softTargetB2 - projectedB2) / currentExpenses;
                        score -= deficit * 3; // Soft Floor Gradient (was 10)
                    }
                }

                // --- EARLY YEAR EQUITY BONUS ---
                // When we have 20+ years, we should favor equity-heavy allocations
                if (yearsRemaining >= 20) {
                    score += alloc[2] * 30; // Bonus for equity (was just +alloc[2] in tiebreaker)
                } else if (yearsRemaining >= 10) {
                    score += alloc[2] * 15;
                }

                // --- ROOFS (Efficiency) ---
                // Hard Roof: Total Safe Assets shouldn't exceed 8 years (was 10)
                const hardRoofSafe = currentExpenses * 8.0;
                if (projectedSafe > hardRoofSafe) {
                    const excess = (projectedSafe - hardRoofSafe) / currentExpenses;
                    score -= excess * 30; // Penalty for Hoarding (was 50)
                }

                // --- RICH MODE (War Chest) ---
                // If we are in the "Comfort Zone" (Safe > 4 years AND < 8 years)
                const comfortZoneStart = currentExpenses * 4.0;
                if (projectedSafe > comfortZoneStart && projectedSafe < hardRoofSafe) {
                    score += 20; // (was 50)
                }
            } // End of Sovereign Strategy

            console.log(`[Optimizer] Allocation ${allocStr}: Survival ${(result.survivalRate * 100).toFixed(1)}%, Avg Years ${result.avgSurvivalYears.toFixed(1)}, Score ${score.toFixed(1)}`);

            if (score > bestScore) {
                bestScore = score;
                bestCandidate = alloc;
            }
        });

        const winStr = `[${(bestCandidate[0] * 100).toFixed(1)},${(bestCandidate[1] * 100).toFixed(1)},${(bestCandidate[2] * 100).toFixed(0)}%]`;
        console.log(`[Optimizer] WINNER: ${winStr} with Score ${bestScore.toFixed(1)}`);

        return bestCandidate;
    }

    /**
     * Generates a grid of feasible allocations.
     * Constraint: Sum = 1.0 (100%)
     * Includes conservative to aggressive allocations and GlidePath-aligned candidate.
     */
    private static generateCandidateAllocations(currentState: GameState): number[][] {
        const candidates: number[][] = [];

        // [Cash, Income, Growth]

        // Aggressive (Start of life - matches typical user config 10/30/60)
        candidates.push([0.10, 0.30, 0.60]);
        candidates.push([0.10, 0.25, 0.65]);
        candidates.push([0.10, 0.20, 0.70]);

        // Balanced
        candidates.push([0.10, 0.40, 0.50]);
        candidates.push([0.15, 0.35, 0.50]);
        candidates.push([0.10, 0.50, 0.40]);

        // Conservative (Late life)
        candidates.push([0.15, 0.55, 0.30]);
        candidates.push([0.20, 0.50, 0.30]);
        candidates.push([0.20, 0.60, 0.20]);

        // GlidePath-Aligned Candidate:
        // Matches actual GlidePath strategy: 70% equity at year 0, decreasing by 0.4% per year to 50%
        const startEquity = 0.70;
        const endEquity = 0.50;
        const duration = 50;
        const slope = (startEquity - endEquity) / duration;
        let glideEquity = startEquity - (currentState.currentYear * slope);
        glideEquity = Math.max(endEquity, Math.min(startEquity, glideEquity));

        // Split safe bucket: 25% Cash, 75% Income of the non-equity portion
        const safePct = 1 - glideEquity;
        const glideAlloc = [safePct * 0.25, safePct * 0.75, glideEquity];
        candidates.push(glideAlloc);

        return candidates;
    }

    private static evaluateAllocation(
        initialState: GameState,
        targetAllocation: number[],
        simulations: number,
        currentAllocation?: number[]
    ): { survivalRate: number, medianEndingWealth: number, avgSurvivalYears: number } {
        let survivalCount = 0;
        let totalSurvivalYears = 0;
        const endingWealths: number[] = [];

        // Estimate Initial Rebalancing Cost (Tax)
        // If we move from Current -> Target, we might sell assets.
        // Simplified Tax Estimate: 10% on gains. 
        // Since we don't track exact cost basis per share in this simulation, 
        // we assume a flat "Turnover Penalty" of 0.5% of the *moved amount* being lost to spread/tax/friction.
        // OR better: Assume 10% tax on the *sold amount* if it's Growth/Income (assuming purely gains for worst case? No that's too harsh).
        // Let's use a heuristic: 1% penalty on the total turnover volume.

        let initialPenalty = 0;
        if (currentAllocation) {
            let turnover = 0;
            for (let i = 0; i < 3; i++) {
                turnover += Math.abs(targetAllocation[i] - currentAllocation[i]);
            }
            turnover = turnover / 2; // Total moved
            // Penalty: Increase to 4% (conservative) to discourage churn -> Reduced to 1% (Loop 7)
            initialPenalty = turnover * 0.01;
        }

        for (let i = 0; i < simulations; i++) {
            let simState = JSON.parse(JSON.stringify(initialState));
            let isAlive = true;
            let yearsSurvived = 0;

            // Apply Initial Rebalancing Friction
            const totalWealth = simState.buckets.reduce((s: number, b: BucketState) => s + b.balance, 0);
            const wealthAfterFriction = totalWealth * (1 - initialPenalty);

            // Set Initial Allocation
            simState.buckets.forEach((b: BucketState, idx: number) => {
                b.balance = wealthAfterFriction * targetAllocation[idx];
            });

            // Simulation Loop
            const remainingYears = simState.config.survivalYears - simState.currentYear;

            for (let year = 0; year < remainingYears; year++) {
                // Check immediate bankruptcy from friction
                const totalBalance = simState.buckets.reduce((sum: number, b: BucketState) => sum + b.balance, 0);
                if (totalBalance <= 0) {
                    isAlive = false;
                    yearsSurvived = year;
                    break;
                }

                // 2. Run Physics
                // Note: We do NOT rebalance *every year* to the target in this version of the sim?
                // The previous code did. Let's keep doing it to simulate "Holding the Strategy".
                // BUT we should implicitly charge friction there too? 
                // No, internal rebalancing of a strategy is usually minimal (selling winners).
                // The big friction is the INITIAL switch.

                // Refill physics logic requires funds.

                // Physics
                const result = simulateNextYearPhysics(simState);

                // Rebalance for NEXT year (Strategy maintenance)
                // We assume "Drift" or "Rebalance". Let's assume Rebalance to Target.
                if (!result.gameOverReason) {
                    const newTotal = result.buckets.reduce((s: number, b: BucketState) => s + b.balance, 0);
                    result.buckets.forEach((b: BucketState, idx: number) => {
                        b.balance = newTotal * targetAllocation[idx];
                    });
                }

                simState.currentYear++;
                simState.buckets = result.buckets;

                if (result.gameOverReason) {
                    if (result.gameOverReason.includes("Victory")) {
                        isAlive = true;
                        yearsSurvived = remainingYears;
                    } else {
                        isAlive = false;
                        yearsSurvived = year;
                        yearsSurvived = year;
                        break;
                    }
                    break;
                }
                yearsSurvived = year + 1;
            }

            if (isAlive) survivalCount++;
            totalSurvivalYears += yearsSurvived;
            const finalWealth = simState.buckets.reduce((a: number, b: BucketState) => a + b.balance, 0);
            endingWealths.push(finalWealth);
        }

        endingWealths.sort((a, b) => a - b);
        const medianEndingWealth = endingWealths.length > 0 ? endingWealths[Math.floor(endingWealths.length / 2)] : 0;

        return {
            survivalRate: survivalCount / simulations,
            medianEndingWealth,
            avgSurvivalYears: totalSurvivalYears / simulations
        };
    }
}
