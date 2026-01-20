# AI Strategy Deep Dive: "AI Smart Patience"

This document outlines the logic, algorithms, and constraints backing the `AI_Max_Survival` strategy in the Retirement Simulator.

## Core Philosophy
The AI strategy is designed to maximize the specific probability of **Survival** (i.e., not running out of money before the target age). Unlike traditional strategies that optimize for "highest return" or "lowest volatility," this agent specifically optimizes for "non-ruin."

## Verification & Trust
The strategy works by running **Monte Carlo Simulations** inside the game loop.
*   **Every Year**: The AI "wakes up" and looks at the current portfolio, market history, and future expense needs.
*   **Candidate Generation**: It proposes several possible asset allocations (e.g., Conservative, Balanced, Aggressive, Safety-First).
*   **Simulation**: For each candidate, it runs 50 (configurable) simulations of the *future* 30-50 years using the game's physics engine (random market returns, inflation, taxes).
*   **Scoring**: It picks the allocation that resulted in the highest survival rate.

## Key constraints & "Guard Rails"
To prevent the AI from "gambling" or being too aggressive, we enforce strict hard-coded rules that override the simulation if necessary.

### 1. The "Safety Wedge" (Years of Safety)
The core metric for risk capacity is **Years of Safety**.
> `Years of Safety = (Cash Balance + Income Bucket Balance) / Annual Expenses`

This tells us: "If the stock market went to zero tomorrow, how many years could we survive on safe assets?"

### 2. Hard Equity Limits (The "Sleep Well" Tiers)
Based on user feedback, we enforce strict limits on Equity (Bucket 3) exposure based on the Safety Wedge.

| Years of Safety (Safe / Exp) | Max Equity Allowed | Description |
| :--- | :--- | :--- |
| **< 3 Years** | **30%** | **Crisis Mode**: Prioritize immediate survival. |
| **3 - 5 Years** | **40%** | **Defensive**: Rebuilding the wedge. |
| **5 - 7 Years** | **50%** | **Balanced**: Cautious growth. |
| **7 - 10 Years** | **60%** | **Conservative Growth**: Standard allocation. |
| **10 - 12 Years** | **70%** | **Moderate**: High comfort. |
| **12 - 15 Years** | **80%** | **Aggressive**: Very high safety margin. |
| **15+ Years** | **90%** | **Freedom**: Max growth, but never 100%. |

**Global Rule**: Equity is **NEVER < 10%** and **NEVER > 90%**.

### 3. Mean Reversion (Sequence of Return Probability)
The AI accounts for "valuation" using a heuristic based on recent returns.
*   **Logic**: If the last 5 years had many NEGATIVE years, the probability of a positive bounce increases (Buy low). If they were very POSITIVE (>15%), the risk of correction increases (Sell high).
*   **Implementation**: A "Reversion Score" adjusts the attractiveness of Equity.
    *   *After Crash*: Equity gets a "bonus" score (encouraging "Buying the Dip").
    *   *After Boom*: Equity gets a "penalty" score (encouraging "Taking Profits").
*   **Safety Lock**: This bonus is **CAPPED** so it never overrides the Hard Safety Constraints. You cannot "Buy the Dip" if you don't have the 3-5 years of safety explicitly secured.

## Full Algorithm (Pseudocode)

```typescript
function findOptimalAllocation(currentState):
    candidates = [
        [10, 30, 60], // Aggressive
        [10, 40, 50], // Balanced
        [20, 50, 30], // Conservative
        ...
    ]

    bestAllocation = null
    bestScore = -Infinity

    for each allocation in candidates:
        // 1. Run Simulations
        survivalRate = runMonteCarlo(currentState, allocation)

        // 2. Base Score
        score = survivalRate * 100

        // 3. Apply Penalties (Constraints)
        
        // Safety Constraint
        yearsSafe = (Alloc[0] + Alloc[1]) * TotalWealth / Expenses
        maxEquity = LookUpTable(yearsSafe) // See table above
        
        if (Alloc[2] > maxEquity):
             score -= HUGE_PENALTY

        // Min/Max Constraint
        if (Alloc[2] > 0.90) score -= HUGE_PENALTY
        if (Alloc[2] < 0.10) score -= HUGE_PENALTY

        // 4. Apply Mean Reversion Bonus
        reversionScore = CalculateMarketHistoryScore()
        if (reversionScore > 0):
             score += Alloc[2] * ReversionBonus // Buy Dip
        else:
             score -= Alloc[2] * ReversionBonus // Sell Rip

        // 5. Select Winner
        if (score > bestScore):
             bestAllocation = allocation
             bestScore = score

    return bestAllocation

## Latest Baseline Results (Jan 2026)
**Parameters**: 50 Year Horizon | 4.5 Cr Corpus | 10L Expenses | 500 Simulations

| Strategy | Survival Rate | Median Years | Worst 10% | Note |
| :--- | :--- | :--- | :--- | :--- |
| **GlidePath** | **94.4%** | 50 | 50 | Highly efficient, simplified linear reduction. |
| **AI_Max_Survival** | **89.8%** | 50 | 49 | Slightly lower due to STRICT safety constraints (missing growth). |
| **Tactical** | **80.2%** | 50 | 45 | Struggles with "sequence of return" timing. |

*Note: The AI strategy is currently configured with strict "Sleep Well" tiers that sacrifice some theoretical maximum growth for guaranteed safety wedges, resulting in a slightly lower pure survival rate in edge cases compared to the math-perfect Glide Path.*
