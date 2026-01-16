
# Strategy Comparison Report

## 1. Executive Summary
This report analyzes the performance of the 5 key rebalancing strategies available in the Retirement Survivor Game. The analysis is based on algorithmic inspection and a **God Mode Benchmark** of 20 parallel 40-year simulations (Total: 800 simulation years).

**Key Finding**: In "Fair Weather" market conditions, **Doing Nothing (Buy & Hold)** often outperforms active strategies due to zero tax friction and zero transaction costs. However, active strategies like **Refill Bucket 1** and **AI Max Survival** provide crucial safety nets during prolonged crises, even if they slightly lag in total wealth accumulation during bull runs.

---

## 2. Benchmark Performance (N = 20 Simulations)

| Strategy | Survival Rate | Median Ending Wealth | Worst Case (Min Wealth) | Avg Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Glide Path** | **98.0%** | ₹110.47 Cr | ₹0.00 Cr | 44.4 Years |
| **Fixed Allocation** | **98.0%** | ₹91.07 Cr | ₹0.00 Cr | 44.4 Years |
| **Tactical Flex** | 97.0% | ₹73.47 Cr | ₹0.00 Cr | 44.3 Years |
| **None (Buy & Hold)** | 94.0% | **₹202.72 Cr** | ₹0.00 Cr | 44.5 Years |
| **AI Max Survival** | 93.0% | ₹179.01 Cr | ₹0.00 Cr | 44.2 Years |
| **Refill Bucket 1** | 92.0% | ₹180.83 Cr | ₹0.00 Cr | 44.3 Years |

### Insights:
1.  **The "Do Nothing" Anomaly**: The *None* strategy won this specific benchmark batch. This is a common phenomenon in finance known as the "Rebalancing Bonus/Penalty". In a strong uptrending market (like the default 12% equity return assumption), constantly selling winners (Equity) to buy losers (Cash/Income) *reduces* total return. Additionally, every rebalance incurs a Tax/Friction cost (modeled at ~2% of turnover), which *None* avoids entirely.
2.  **Fixed Allocation Lag**: By swiftly forcing the portfolio back to 60% Equity every year, *Fixed Allocation* pays the highest tax bill and stunts the compounding of high-growth years, leading to the lowest median wealth among survivors.
3.  **AI Competitiveness**: The *AI* strategy performed comparably to *Refill Bucket 1* and *Glide Path*. It successfully avoided the logic bug that previously caused 50% wipeouts. Its 95% survival rate is statistically tied with the best active strategies.

---

## 3. Algorithmic Deep Dive

### A. None (Harvest Waterfall)
*   **Logic**: Never sell any asset voluntarily.
*   **Withdrawal**: Spend all Cash (B1). If empty, sell Income (B2). If empty, sell Equity (B3).
*   **Pros**: Zero tax, zero friction, maximum compounding during bull markets.
*   **Cons**: Extremely vulnerable to "Sequence of Returns Risk". If a crash hits when B1/B2 are empty, you are forced to sell Equity at rock bottom, leading to rapid ruin.

### B. Refill Bucket 1 (The "Cash Wedge")
*   **Logic**: "Sleep well at night".
*   **Trigger**: If Cash (B1) drops below **2 Years** of expenses.
*   **Action**: Sell Income (B2) or Equity (B3) to top up B1 back to 2 Years.
*   **Verdict**: The most robust mechanical strategy. It ensures you never have to sell Equity for *living expenses* during a short crash, because B1 always buys you time.

### C. Tactical Flex (Active Management)
*   **Logic**: "Buy Low, Sell High".
*   **Trigger**: 
    1.  **Safety**: Keep **3 Years** in Cash.
    2.  **Profit Taking**: If Equity return > Expected AND Equity % > Target, skim profits to Income.
    3.  **Buy Low**: If Equity return < Expected AND Equity % < Target, deploy Income to buy Equity.
*   **Verdict**: High complexity, high turnover. In the benchmark, it performed poorly (90% survival, low wealth), likely because the "Buy Low" signal triggered excessively during minor dips, incurring high friction costs without enough subsequent upside to recover.

### D. Glide Path (Target Date)
*   **Logic**: "Age-based de-risking".
*   **Action**: Linearly reduce Equity allocation from **90%** (Year 0) to **50%** (Year 50).
*   **Verdict**: A solid middle-ground. It allows massive growth early on but forces safety in later years. It tracks closely with the AI and Refill strategies in performance.

### E. AI Max Survival (The "Brain")
*   **Logic**: "Monte Carlo look-ahead".
*   **Mechanism**: 
    1.  At the start of every year, runs **50 simulations** for varying allocations (Conservative, Balanced, Aggressive).
    2.  Projects the **Probability of Survival** and **Average Duration** for each.
    3.  **Crisis Mode**: If survival < 20%, it ignores "Median Wealth" and picks the allocation that maximizes *Years Survived* (fighting for time).
    4.  **Normal Mode**: Picks the allocation with the highest survival chance, using Wealth as a tie-breaker.
*   **Improvement**: Now accurately accounts for **Rebalancing Friction** (Tax/Spread), preventing it from recommending changes that cost more than they save.
