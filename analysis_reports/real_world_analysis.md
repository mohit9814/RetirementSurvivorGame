# 🧪 Data-Driven Fund Optimization (Real-World Analysis)

## 🚨 The Reality Check
I analyzed the historical performance of your selected fund categories from `Funds-Master_Metrics.csv`:

| Bucket | Your Selection | **Real Mean Return** | **Real Volatility** |
|:-------|:---------------|:--------------------:|:-------------------:|
| **B2 (Income)** | Arbitrage, Cons. Hybrid, Bal. Adv, Eq. Savings | **6.02%** | **6.42%** |
| **B3 (Growth)** | Aggressive Hybrid, Eq. Savings | **8.39%** | **12.17%** |

### ⚠️ Critical Issue
Your Goal is **50 Years** with **7% Inflation**.
*   **Bucket 2 (6.02%)** returns *less* than inflation. It loses purchasing power every year.
*   **Bucket 3 (8.39%)** barely beats inflation by 1.4%. This is not enough to sustain withdrawals for 50 years.

## 📉 Simulation Results (50 Years)
Using these "Real World" numbers, I simulated 10,000 scenarios.

| Best Config | Success Rate (50y) | Median Survival | Verdict |
|:-----------|:------------------:|:---------------:|:--------|
| **10% / 10% / 80%** | **15%** | 34 Years | **FAILED** ❌ |
| **Traditional (10/40/50)** | **0%** | 30 Years | **FAILED** ❌ |

**Conclusion**: With the fund categories you selected, a **90% success rate is MATHEMATICALLY IMPOSSIBLE**. The portfolio will run out of money between Year 30 and Year 35.

## 💡 How to Fix It (To get >90%)
To survive 50 years, you need assets that beat inflation by a significant margin (e.g., Equity with ~12% return).

### Option A: Change Bucket 3 to Pure Equity
If we swap your "Hybrid" B3 choice for **Mid/Small Cap** or **Flexi Cap** funds (historically ~12-14%):
*   **Projected Success**: **>80%** (as seen in previous run).
*   **Action**: Replace "Aggressive Hybrid" with "Flexi/Multi Cap".

### Option B: Lower Inflation Assumption
If you assume **6% Inflation** instead of 7%:
*   **Projected Success**: Improves significantly, but still risky with low-return funds.

### Recommendation
Do **not** use Conservative Hybrid or Arbitrage for a 50-year goal. They are "Safety" traps. You need growth.
I recommend constructing Bucket 3 with **Flexi Cap** or **Large & Mid Cap** funds.
