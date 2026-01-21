import { describe, it, expect } from 'vitest';
import { applyRebalancing } from '../engine/RebalancingEngine';
import type { GameState, BucketState } from '../types';

// Helper to create a base mock state
const createMockState = (strategy: string, buckets: number[], overrides: any = {}): GameState => {
    const totalWealth = buckets.reduce((a, b) => a + b, 0);
    const bucketStates: BucketState[] = buckets.map((b, i) => ({
        id: `B${i + 1}`,
        name: i === 0 ? 'Cash' : i === 1 ? 'Income' : 'Growth',
        balance: b,
        allocation: 0, // Not used directly in logic often, mainly derived
        expectedReturn: 0.05,
        risk: 0.1,
        lastYearReturn: 0.05
    }));

    return {
        currentYear: 0,
        currentAge: 60,
        isGameOver: false,
        buckets: bucketStates,
        history: [],
        config: {
            initialCorpus: totalWealth,
            initialExpenses: 1200000, // 12L
            inflationRate: 0.06,
            survivalYears: 40,
            rebalancingStrategy: strategy,
            bucketConfigs: [
                { id: '1', name: 'Cash', allocation: 0.1, expectedReturn: 0.05, risk: 0.0, description: '' },
                { id: '2', name: 'Income', allocation: 0.4, expectedReturn: 0.08, risk: 0.1, description: '' },
                { id: '3', name: 'Growth', allocation: 0.5, expectedReturn: 0.12, risk: 0.15, description: '' }
            ],
            ...overrides
        }
    };
};

describe('Strategy Engine: Rebalancing Logic', () => {

    describe('1. Safety Refill (RefillBucket1)', () => {
        it('should refill B1 from B2/B3 when below 2 years of expenses', () => {
            const expenses = 1200000;
            // B1 has 1 year expenses (Deficit of 1 year = 12L)
            const state = createMockState('RefillBucket1', [expenses * 1.0, expenses * 10, expenses * 10]);

            // Engine calculates target based on NEXT year's inflated expenses
            // Inflation 6%
            const nextYearExpense = expenses * 1.06;
            const targetB1 = nextYearExpense * 2.0;

            const newState = applyRebalancing(state);

            // Expected: B1 Should be refilled to Target
            const b1 = newState.buckets[0].balance;
            expect(b1).toBeCloseTo(targetB1, 0);
        });

        it('should do nothing if B1 is safe (>2 years)', () => {
            const expenses = 1200000;
            const nextYearExpense = expenses * 1.06;
            const targetB1 = nextYearExpense * 2.0;

            // Ensure we are truly above the TARGET (which includes inflation)
            const safeBalance = targetB1 + 1000;

            const state = createMockState('RefillBucket1', [safeBalance, expenses * 10, expenses * 10]);
            const newState = applyRebalancing(state);
            expect(newState.buckets[0].balance).toBe(state.buckets[0].balance);
        });
    });

    describe('2. Custom AI Strategy (Regression Checks)', () => {
        it('[CRITICAL] Should NOT ignore Custom AI strategies (Fix for 100% Equity Bug)', () => {
            // Setup: 
            // - Custom Strategy based on 'AI_Max_Survival'
            // - Crisis situation: Zero Safe assets (0 years safety)
            // - Policy says: <3 Years safety => Max Equity 50%
            // - Current: 100% Equity (Drifted)

            const expenses = 1200000;
            // B1=0, B2=0, B3=1Cr (100% Equity)
            const state = createMockState('Custom', [0, 0, 10000000], {
                customStrategy: {
                    baseStrategy: 'AI_Max_Survival',  // THIS WAS THE BUG TRIGGER
                    params: {
                        aiPolicy: { lt3: 0.5, t3to5: 0.6, gt15: 0.9 }, // Strict 50% max in crisis
                        aiMaxEquity: 0.9,
                        aiMinEquity: 0.1
                    }
                }
            });

            // Run Rebalancing
            const newState = applyRebalancing(state);

            // Logic Check:
            // 1. Safety is 0 years (< 3y).
            // 2. Policy limit matches 'lt3' => 50% Max Equity.
            // 3. Current Equity is 100%.
            // 4. AI MUST sell 50% of B3 to buy Safe assets.

            const totalWealth = newState.buckets.reduce((a, b) => a + b.balance, 0);
            const equityAlloc = newState.buckets[2].balance / totalWealth;
            const safeAlloc = (newState.buckets[0].balance + newState.buckets[1].balance) / totalWealth;

            // Assertions
            expect(equityAlloc).toBeLessThan(0.99); // Should NOT be 100% anymore
            expect(equityAlloc).toBeCloseTo(0.5, 1); // Should be roughly 50%
            expect(safeAlloc).toBeCloseTo(0.5, 1);   // Should have refilled safe buckets
        });
    });

    describe('3. Glide Path', () => {
        it('should be aggressive (70%) at start of career (Year 0 / 40)', () => {
            // Need enough in B2/Income to fund the move to 70% equity
            const state = createMockState('GlidePath', [100000, 800000, 100000]);
            state.config.survivalYears = 40;
            state.currentYear = 0; // 40 years remaining (Aggr Zone > 25)

            const newState = applyRebalancing(state);
            const total = newState.buckets.reduce((a, b) => a + b.balance, 0);
            const equityPct = newState.buckets[2].balance / total;

            // Total 1M. Target 700k. 
            // B2 has 800k. Can fund 600k easily.
            expect(equityPct).toBeCloseTo(0.70, 2); // default max equity
        });

        it('should be conservative (50%) at end of career (Year 38 / 40)', () => {
            const state = createMockState('GlidePath', [100000, 100000, 100000]);
            state.config.survivalYears = 40;
            state.currentYear = 38; // 2 years remaining (Conservative Zone < 5)

            const newState = applyRebalancing(state);
            const total = newState.buckets.reduce((a, b) => a + b.balance, 0);
            const equityPct = newState.buckets[2].balance / total;

            expect(equityPct).toBeCloseTo(0.50, 2); // default min equity
        });
    });

    describe('4. Tactical Flex', () => {
        it('should "Buy Low" when B3 return is poor', () => {
            const state = createMockState('Tactical', [2000000, 2000000, 2000000]);
            state.buckets[2].lastYearReturn = -0.10; // -10% Crash (Expected 12%)

            // Tactical logic requires 'prevHistory' to exist to run
            state.history = [{
                year: -1, totalWealth: 6000000, buckets: state.buckets,
                startYear: 2024, endYear: 2024, isFailure: false, params: {}
            } as any];

            // Current Alloc: ~33% Growth. Target: ~60%. 
            // Missing Alloc YES. Missing Return YES. -> BUY SIGNAL.

            const newState = applyRebalancing(state);

            // Check History for "Buy Low" log
            const moves = newState.history[0]?.rebalancingMoves || [];

            const buyMove = moves.find(m => m.reason === 'Buy Low Opportunity');

            expect(buyMove).toBeDefined();
            expect(buyMove?.fromBucketIndex).toBe(1); // From Income
            expect(buyMove?.toBucketIndex).toBe(2);   // To Growth
        });
    });

    describe('5. Custom AI Permutations (Dynamic Policy)', () => {
        // Define the tiers and expected behaviors
        const scenarios = [
            { name: 'Crisis (<3 Years)', safeYears: 1.0, policyKey: 'lt3', expMaxEq: 0.30 },
            { name: 'Defensive (3-5 Years)', safeYears: 4.0, policyKey: 't3to5', expMaxEq: 0.40 },
            { name: 'Balanced (5-7 Years)', safeYears: 6.0, policyKey: 't5to7', expMaxEq: 0.50 },
            { name: 'Growth (7-10 Years)', safeYears: 8.0, policyKey: 't7to10', expMaxEq: 0.60 },
            { name: 'Secure (10-12 Years)', safeYears: 11.0, policyKey: 't10to12', expMaxEq: 0.70 },
            { name: 'Wealthy (12-15 Years)', safeYears: 13.0, policyKey: 't12to15', expMaxEq: 0.80 },
            { name: 'Freedom (>15 Years)', safeYears: 20.0, policyKey: 'gt15', expMaxEq: 0.90 },
        ];

        scenarios.forEach(sc => {
            it(`should limit equity to ${sc.expMaxEq * 100}% when Safety is ${sc.name}`, () => {
                const expenses = 1000000;
                // Setup:
                // 1. Create a portfolio that is "Reasonably Wealthy" but not "Infinite"
                //    to avoid the "Hoarding Penalty" (Assets > 8 years) from dominating the "Equity Limit Penalty".
                // 2. We want Safe Assets = safeYear * expenses initially.
                // 3. We want Total Wealth such that Target Equity % is achievable without massive safety hoarding.

                const safeAmount = expenses * sc.safeYears;

                // We split safe amount between B1 and B2
                const b1 = safeAmount * 0.2;
                const b2 = safeAmount * 0.8;

                // If Target Max Eq is 50%, then Safe should be 50%.
                // Ideal Total = Safe / (1 - MaxEq).
                // We add 20% extra equity to force a "Sell" signal down to the limit.
                const idealTotal = safeAmount / (1 - sc.expMaxEq);
                const targetGrowth = idealTotal * sc.expMaxEq;
                const b3 = targetGrowth * 1.2; // Start 20% Overweight

                // Use a realistic Progressive Policy for all tests
                // This ensures that if safety drops, we fall into a valid lower tier, not a 5% trap.
                const customPolicy = {
                    lt3: 0.30,
                    t3to5: 0.40,
                    t5to7: 0.50,
                    t7to10: 0.60,
                    t10to12: 0.70,
                    t12to15: 0.80,
                    gt15: 0.90
                };

                const state = createMockState('Custom', [b1, b2, b3], {
                    initialExpenses: expenses,
                    customStrategy: {
                        baseStrategy: 'AI_Max_Survival',
                        params: {
                            aiPolicy: customPolicy,
                            aiMaxEquity: 1.0,
                            aiMinEquity: 0.0
                        }
                    }
                });

                const newState = applyRebalancing(state);

                // Calculations
                const total = newState.buckets.reduce((a, b) => a + b.balance, 0);
                const finalEquityPct = newState.buckets[2].balance / total;

                // Assertion
                // The optimizer "Score" is heavily penalized if Equity > Limit.
                // So it should sell equity until it is AT or BELOW the limit.
                // Since our Mock optimization loop in tests is real, it should find the optimal point near the limit.

                // Note: The optimizer is probabilistic/Monte Carlo based in theory, but our current mock 
                // might be deterministic or we rely on the penalty logic.
                // With high penalties, it should be very close.

                expect(finalEquityPct).toBeLessThanOrEqual(sc.expMaxEq + 0.01);

                // Only assert minimum equity if we are not in deep crisis (where 0% is valid)
                if (sc.safeYears > 5) {
                    expect(finalEquityPct).toBeGreaterThan(sc.expMaxEq - 0.05);
                }
            });
        });

        it('should respect Global Max Equity override even if Policy allows more', () => {
            // Case: Freedom Mode (>15y) -> Policy says 90%
            // Global Override -> Says 50%
            // Result should be 50%
            const expenses = 100000;
            // Ensure > 15 years safety.
            // Expenses 100k. Safe needed > 1.5M.
            // Let's use 20M wealth. Safe ~4M (20%).
            const state = createMockState('Custom', [expenses * 20, expenses * 20, expenses * 160], {
                initialExpenses: expenses,
                customStrategy: {
                    baseStrategy: 'AI_Max_Survival',
                    params: {
                        // Full Policy needed so we don't hit undefined tiers if safety fluctuates
                        aiPolicy: {
                            lt3: 0.30, t3to5: 0.40, t5to7: 0.50, t7to10: 0.60,
                            t10to12: 0.70, t12to15: 0.80, gt15: 0.90
                        },
                        aiMaxEquity: 0.50, // USER HARD CAP
                        aiMinEquity: 0.0
                    }
                }
            });
            const newState = applyRebalancing(state);
            const total = newState.buckets.reduce((a, b) => a + b.balance, 0);
            const equityPct = newState.buckets[2].balance / total;

            expect(equityPct).toBeCloseTo(0.50, 1);
        });
    });

    describe('6. Custom Strategy Bases (Universal Overrides)', () => {
        it('should execute Custom RefillBucket1 with overridden parameters', () => {
            const expenses = 100000;
            // Standard Refill is 2 years. We override to 5 years.
            // B1 has 3 years (300k). Standard would do nothing. Custom (5y) should refill.
            const b1 = expenses * 3;
            const b2 = expenses * 10;
            const b3 = expenses * 10;

            const state = createMockState('Custom', [b1, b2, b3], {
                customStrategy: {
                    baseStrategy: 'RefillBucket1',
                    params: { safetyThresholdYears: 5 }
                }
            });

            const newState = applyRebalancing(state);

            // Expect B1 to be ~5 years (ignoring inflation minor diffs, just big jump check)
            // Next year expense = 106k. 5y = ~530k.
            const finalB1 = newState.buckets[0].balance;
            expect(finalB1).toBeGreaterThan(expenses * 5.0); // Should definitely be above the 300k we started with
        });

        it('should execute Custom GlidePath with overridden equity limits', () => {
            // Standard GlidePath Max is 70%. We override to 90%.
            const expenses = 100000;
            // B2 has enough to fund the move
            const state = createMockState('Custom', [expenses, expenses * 10, expenses], {
                customStrategy: {
                    baseStrategy: 'GlidePath',
                    params: { gpStartEquity: 0.90 }
                }
            });
            state.config.survivalYears = 40;
            state.currentYear = 0; // Aggressive zone

            const newState = applyRebalancing(state);
            const total = newState.buckets.reduce((a, b) => a + b.balance, 0);
            const equityPct = newState.buckets[2].balance / total;

            expect(equityPct).toBeCloseTo(0.90, 2);
        });
    });

});
