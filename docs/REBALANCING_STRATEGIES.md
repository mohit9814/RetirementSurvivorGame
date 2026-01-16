# Retirement Bucket Rebalancing Strategies

## Overview

This document provides detailed algorithm specifications for bucket rebalancing strategies used in the Retirement Bucket Survivor game. These strategies manage the allocation between three buckets:

| Bucket | Type | Purpose | Risk | Liquidity |
|--------|------|---------|------|-----------|
| B1 | Cash/Liquid | Immediate expenses (1-2 years) | Low | High |
| B2 | Income | Medium-term buffer (3-5 years) | Medium | Medium |
| B3 | Growth/Equity | Long-term growth | High | Low |

---

## Input Parameters & Configuration

### Complete Type Definitions

```typescript
// === BUCKET CONFIGURATION ===
interface BucketConfig {
    type: 'Cash' | 'Income' | 'Growth';
    name: string;                    // Display name, e.g., "Bucket 1 (Cash/Liquid)"
    allocation: number;              // Initial allocation (0.0 - 1.0), e.g., 0.10 = 10%
    expectedReturn: number;          // Annual expected return (0.0 - 1.0), e.g., 0.04 = 4%
    volatility: number;              // Standard deviation (0.0 - 1.0), e.g., 0.15 = 15%
}

// === GAME CONFIGURATION ===
interface GameConfig {
    initialCorpus: number;           // Starting wealth in INR, e.g., 50000000 (5 Crores)
    initialExpenses: number;         // Year 1 annual expenses in INR, e.g., 1200000 (12 Lakhs)
    inflationRate: number;           // Annual inflation (0.0 - 1.0), e.g., 0.07 = 7%
    survivalYears: number;           // Target duration in years, e.g., 30 or 45
    enableTaxation: boolean;         // Enable LTCG tax simulation
    rebalancingStrategy: 'None' | 'RefillBucket1' | 'Tactical' | 'GlidePath' | 
                         'FixedAllocation' | 'AI_Max_Survival';
    bucketConfigs: BucketConfig[];   // Array of 3 bucket configurations
}

// === BUCKET STATE (Runtime) ===
interface BucketState {
    type: 'Cash' | 'Income' | 'Growth';
    name: string;
    balance: number;                 // Current balance in INR
    lastYearReturn: number;          // Last year's return (can be negative)
}

// === GAME STATE (Full Runtime Context) ===
interface GameState {
    currentYear: number;             // 0 = start, increments each year
    startYear: number;               // Calendar year (e.g., 2024)
    maxYears: number;                // = survivalYears from config
    buckets: BucketState[];          // Current bucket balances
    history: YearlyResult[];         // Historical data for all years
    config: GameConfig;              // Original configuration
    isGameOver: boolean;
    gameOverReason?: string;         // "Victory" or "Bankrupt" message
}
```

### Default Test Configuration

The benchmark tests use these default values:

```typescript
const INITIAL_CONFIG: GameConfig = {
    initialCorpus: 50000000,         // ₹5 Crores
    initialExpenses: 1200000,        // ₹12 Lakhs/year
    inflationRate: 0.07,             // 7% annual inflation
    survivalYears: 30,               // 30-year default (tests use 45)
    enableTaxation: true,
    rebalancingStrategy: 'None',
    bucketConfigs: [
        {
            name: 'Bucket 1 (Cash/Liquid)',
            type: 'Cash',
            allocation: 0.10,        // 10%
            expectedReturn: 0.05,    // 5.0% return
            volatility: 0.06         // 6.0% volatility
        },
        {
            name: 'Bucket 2 (Income)',
            type: 'Income',
            allocation: 0.25,        // 25%
            expectedReturn: 0.092,   // 9.2% return
            volatility: 0.078        // 7.8% volatility
        },
        {
            name: 'Bucket 3 (Equity)',
            type: 'Growth',
            allocation: 0.65,        // 65%
            expectedReturn: 0.136,   // 13.6% return
            volatility: 0.161        // 16.1% volatility
        }
    ]
};
```

### Key Derived Values (Computed at Runtime)

```typescript
// Total wealth at any point
const totalWealth = buckets.reduce((sum, b) => sum + b.balance, 0);

// Inflated annual expense for current year
const annualExpense = initialExpenses * Math.pow(1 + inflationRate, currentYear);

// Years remaining in simulation
const yearsRemaining = survivalYears - currentYear;

// Current allocation percentages
const currentAllocation = buckets.map(b => b.balance / totalWealth);
```

---

## Benchmark Results (100 simulations, 45 years, 5Cr corpus, 12L/year expenses)

| Strategy | Survival Rate | Median Ending Wealth | Avg Years Lasted |
|----------|---------------|---------------------|------------------|
| **GlidePath** | **98%** | ₹110.47 Cr | 44.4 |
| FixedAllocation | 98% | ₹91.07 Cr | 44.4 |
| Tactical | 97% | ₹73.47 Cr | 44.3 |
| None (Do Nothing) | 94% | ₹202.72 Cr | 44.5 |
| AI_Max_Survival | 93% | ₹179.01 Cr | 44.2 |
| RefillBucket1 | 92% | ₹180.83 Cr | 44.3 |

---

## Strategy 1: None (Do Nothing)

### Description
No active rebalancing. Withdrawals come from B1, and when depleted, from B2, then B3. Market returns naturally shift allocations.

### Algorithm
```
No action taken.
```

### When to Use
- Passive investors who trust initial allocation
- High corpus-to-expense ratio (>50x)

### Pros/Cons
| Pros | Cons |
|------|------|
| Zero transaction costs | No risk management |
| Tax efficient (no sales) | Sequence of returns risk |
| Simple | Can deplete B1 quickly in crashes |

---

## Strategy 2: RefillBucket1

### Description
Ensures B1 always has 2 years of expenses. Refills from B2, then B3 if needed.

### Algorithm
```typescript
function refillBucket1(state: GameState): void {
    const annualExpense = initialExpenses * (1 + inflationRate)^currentYear;
    const targetB1 = annualExpense * 2;  // 2 years buffer
    
    if (B1.balance < targetB1) {
        let deficit = targetB1 - B1.balance;
        
        // Try B2 first
        if (B2.balance > 0) {
            const take = min(B2.balance, deficit);
            B2.balance -= take;
            B1.balance += take;
            deficit -= take;
        }
        
        // If still deficit, try B3
        if (deficit > 0 && B3.balance > 0) {
            const take = min(B3.balance, deficit);
            B3.balance -= take;
            B1.balance += take;
        }
    }
}
```

### Example
- Annual expense: ₹12L (inflated)
- Target B1: ₹24L
- Current B1: ₹10L → Deficit: ₹14L
- B2 has ₹50L → Move ₹14L from B2 to B1

### When to Use
- Conservative investors prioritizing liquidity
- High inflation environments

---

## Strategy 3: GlidePath ⭐ RECOMMENDED

### Description
Dynamically adjusts equity allocation based on **years remaining** in the simulation. Starts aggressive (70% equity) when time horizon is long, becomes conservative (50% equity) as end approaches.

### Algorithm
```typescript
function glidePath(state: GameState): void {
    const yearsRemaining = survivalYears - currentYear;
    
    // Equity allocation thresholds
    const maxEquity = 0.70;  // 70% when >= 25 years remaining
    const minEquity = 0.50;  // 50% when <= 5 years remaining
    const aggressiveThreshold = 25;
    const conservativeThreshold = 5;
    
    // Calculate target equity
    let targetEquity: number;
    if (yearsRemaining >= aggressiveThreshold) {
        targetEquity = maxEquity;
    } else if (yearsRemaining <= conservativeThreshold) {
        targetEquity = minEquity;
    } else {
        // Linear interpolation
        const range = aggressiveThreshold - conservativeThreshold;
        const position = yearsRemaining - conservativeThreshold;
        targetEquity = minEquity + (maxEquity - minEquity) * (position / range);
    }
    
    // Rebalance B3 to target
    const totalWealth = B1 + B2 + B3;
    const targetB3 = totalWealth * targetEquity;
    const diff = B3.balance - targetB3;
    
    if (diff > 0) {
        // Too much equity → Move to B2
        B3.balance -= diff;
        B2.balance += diff;
    } else if (diff < 0) {
        // Too little equity → Buy from B2
        const shortfall = abs(diff);
        if (B2.balance > shortfall) {
            B2.balance -= shortfall;
            B3.balance += shortfall;
        }
    }
    
    // Safety Floor: Ensure B1 has 1 year expenses
    const annualExpense = initialExpenses * (1 + inflationRate)^currentYear;
    if (B1.balance < annualExpense) {
        const deficit = annualExpense - B1.balance;
        if (B2.balance > deficit) {
            B2.balance -= deficit;
            B1.balance += deficit;
        }
    }
}
```

### Equity Allocation Over Time
| Years Remaining | Target Equity |
|-----------------|---------------|
| 45 (start) | 70% |
| 30 | 70% |
| 25 | 70% |
| 20 | 65% |
| 15 | 60% |
| 10 | 55% |
| 5 | 50% |
| 0 | 50% |

### Example
- Year 15, survivalYears=45 → yearsRemaining=30 → 70% equity
- Year 35, survivalYears=45 → yearsRemaining=10 → 55% equity
- Year 42, survivalYears=45 → yearsRemaining=3 → 50% equity

### When to Use
- Long-term retirement planning (20+ years)
- Investors comfortable with initial equity exposure

---

## Strategy 4: FixedAllocation

### Description
Rebalances to maintain the original allocation percentages every year.

### Algorithm
```typescript
function fixedAllocation(state: GameState): void {
    const totalWealth = B1 + B2 + B3;
    
    // Reset to initial allocation (from config)
    B1.balance = totalWealth * bucketConfigs[0].allocation;
    B2.balance = totalWealth * bucketConfigs[1].allocation;
    B3.balance = totalWealth * bucketConfigs[2].allocation;
}
```

### Example
With 10/30/60 allocation and ₹5Cr total:
- B1 → ₹50L
- B2 → ₹150L
- B3 → ₹300L

### When to Use
- Investors who want consistent risk profile
- Those who believe in mean reversion

### Pros/Cons
| Pros | Cons |
|------|------|
| Consistent risk exposure | High transaction costs |
| Automatic profit-taking | May sell low in crashes |
| Simple to understand | Tax inefficient |

---

## Strategy 5: Tactical

### Description
Combines multiple rules: safety refill, profit skimming, buy-low opportunities, and a tactical glide path.

### Algorithm
```typescript
function tactical(state: GameState): void {
    const annualExpense = initialExpenses * (1 + inflationRate)^currentYear;
    const tacticalYears = 3;  // Buffer years
    const targetB1 = annualExpense * tacticalYears;
    const maxB1 = targetB1 * 1.5;
    
    // Rule 1: Safety Refill
    if (B1.balance < targetB1) {
        let deficit = targetB1 - B1.balance;
        // Refill from B2, then B3
        if (B2.balance > 0) {
            const take = min(B2.balance, deficit);
            B2.balance -= take;
            B1.balance += take;
            deficit -= take;
        }
        if (deficit > 0 && B3.balance > 0) {
            const take = min(B3.balance, deficit);
            B3.balance -= take;
            B1.balance += take;
        }
    }
    // Rule 1b: Deploy Excess Cash
    else if (B1.balance > maxB1) {
        const excess = B1.balance - targetB1;
        B1.balance -= excess;
        B2.balance += excess;
    }
    
    // Rule 2: Tactical Glide Path (Equity reduces 0.5%/year)
    const glideDecay = currentYear * 0.005;
    const tacticalTargetAlloc = max(0.30, initialEquityAlloc - glideDecay);
    const b3CurrentAlloc = B3.balance / totalWealth;
    const b3Return = B3.lastYearReturn;
    
    // 2a: Profit Skimming (beating expected & overweight)
    if (b3Return > expectedReturn && b3CurrentAlloc > tacticalTargetAlloc) {
        const excessRate = b3Return - expectedReturn;
        const skimAmount = B3.balance * excessRate;
        B3.balance -= skimAmount;
        B2.balance += skimAmount;
    }
    // 2b: Buy Low (underperforming & underweight)
    else if (b3Return < expectedReturn && b3CurrentAlloc < tacticalTargetAlloc) {
        const missingRate = expectedReturn - b3Return;
        const buyAmount = min(B2.balance * 0.2, B3.balance * missingRate);
        B2.balance -= buyAmount;
        B3.balance += buyAmount;
    }
    // 2c: Glide Path Enforcement (>5% deviation)
    else if (b3CurrentAlloc > tacticalTargetAlloc + 0.05) {
        const excessAmt = (b3CurrentAlloc - tacticalTargetAlloc) * totalWealth;
        const trimAmt = excessAmt * 0.5;  // Smooth trim
        B3.balance -= trimAmt;
        B2.balance += trimAmt;
    }
}
```

### When to Use
- Active investors who want multiple rules
- Those who believe in market timing

### Pros/Cons
| Pros | Cons |
|------|------|
| Multiple safety layers | Complex to understand |
| Profit-taking built in | May overtrade |
| Buy-low opportunities | Lower survival rate in tests |

---

## Strategy 6: AI_Max_Survival

### Description
Uses Monte Carlo simulation to evaluate candidate allocations and picks the one with highest survival probability. Includes constraint penalties for safety floors/ceilings.

### Algorithm
```typescript
function aiMaxSurvival(state: GameState): number[] {
    const candidates = generateCandidateAllocations(state);
    const currentAllocation = getCurrentAllocation();
    candidates.push(currentAllocation);  // Status quo option
    
    let bestCandidate = candidates[0];
    let bestScore = -Infinity;
    
    for (const alloc of candidates) {
        // Run Monte Carlo simulations
        const result = evaluateAllocation(state, alloc, 20);  // 20 sims
        
        // Base score = survival rate
        let score = result.survivalRate * 100;
        
        // Tiebreaker: prefer equity when survival similar
        if (result.survivalRate > 0.2) {
            score += alloc[2];  // Equity bonus
        }
        
        // Early year equity bonus
        const yearsRemaining = survivalYears - currentYear;
        if (yearsRemaining >= 20) {
            score += alloc[2] * 30;
        } else if (yearsRemaining >= 10) {
            score += alloc[2] * 15;
        }
        
        // Safety constraint penalties
        const projectedB1 = alloc[0] * totalWealth;
        const projectedB2 = alloc[1] * totalWealth;
        const projectedSafe = projectedB1 + projectedB2;
        
        // Floor penalties
        if (projectedB1 < annualExpense * 1.0) {
            score -= 200;  // Hard floor
        } else if (projectedB1 < annualExpense * 2.0) {
            score -= (2.0 - projectedB1/annualExpense) * 5;  // Soft floor
        }
        
        if (projectedB2 < annualExpense * 2.0) {
            score -= 100;  // Hard floor
        }
        
        // Roof penalty (too much safe assets = opportunity cost)
        if (projectedSafe > annualExpense * 8.0) {
            const excess = (projectedSafe - annualExpense * 8) / annualExpense;
            score -= excess * 30;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestCandidate = alloc;
        }
    }
    
    return bestCandidate;
}

function generateCandidates(state): number[][] {
    return [
        // Aggressive
        [0.10, 0.30, 0.60],
        [0.10, 0.25, 0.65],
        [0.10, 0.20, 0.70],
        // Balanced
        [0.10, 0.40, 0.50],
        [0.15, 0.35, 0.50],
        [0.10, 0.50, 0.40],
        // Conservative
        [0.15, 0.55, 0.30],
        [0.20, 0.50, 0.30],
        [0.20, 0.60, 0.20],
        // GlidePath-aligned (dynamic)
        glidePathAllocation(yearsRemaining)
    ];
}
```

### When to Use
- Users who want "AI-driven" optimization
- When computational resources allow

### Pros/Cons
| Pros | Cons |
|------|------|
| Adapts to market conditions | Computationally expensive |
| Considers survival probability | Noisy with few simulations |
| Multiple candidate allocations | Complex to debug |

---

## Implementation Guide for FireCompass

### Key Inputs Required
```typescript
interface RebalancingInput {
    buckets: {
        balance: number;
        type: 'Cash' | 'Income' | 'Growth';
        lastYearReturn: number;
    }[];
    config: {
        initialExpenses: number;
        inflationRate: number;
        survivalYears: number;
        bucketConfigs: {
            allocation: number;
            expectedReturn: number;
        }[];
    };
    currentYear: number;
}
```

### Recommended Default: GlidePath
Based on benchmark results, **GlidePath** offers the best balance of:
- High survival rate (98%)
- Simplicity (no Monte Carlo)
- Predictable behavior

### Implementation Priority
1. **GlidePath** - Simple, best results
2. **RefillBucket1** - Conservative fallback
3. **FixedAllocation** - For users who want consistency
4. **AI_Max_Survival** - Advanced users only

---

## Tax Considerations (India)

When moving funds between buckets:
- **B3 → B2/B1**: LTCG tax applies (12.5% on gains > ₹1.25L)
- **B2 → B1**: May trigger LTCG on debt funds (post-2023 rules)
- **B1 → B2/B3**: No tax (investing, not realizing gains)

Approximate tax impact for rebalancing moves:
```
Tax = moveAmount * 0.5 * 0.125  // ~50% is gains, 12.5% LTCG
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/engine/RebalancingEngine.ts` | Strategy implementations |
| `src/engine/OptimizationEngine.ts` | AI Monte Carlo logic |
| `src/engine/PhysicsEngine.ts` | Market simulation |
| `src/scripts/compare_strategies.ts` | Benchmark script |
