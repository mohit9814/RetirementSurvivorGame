# Comparative Analysis: Retirement Withdrawal Strategies
**Date:** Jan 2026
**Based on:** High-Fidelity Sensitivity Matrix (50 Simulations/Config)

## Executive Summary
In a rigorous stress test of **50-year survival** for a standard Indian retiree portfolio (4.5 Cr Corpus, 10L Expenses), **Linear Glide Path** and **Safety Refill (RefillBucket1)** emerged as the top-performing strategies, delivering **96% survival rates** with a Balanced (10/50/40) allocation.

The analysis confirms that **passive, rule-based simplicity** often outperforms complex tactical maneuvering. While the AI strategy (`AI_Max_Survival`) is extremely robust (92% survival in conservative modes), its strict safety constraints can occasionally drag on performance during long bull markets compared to the math-perfect efficiency of a Glide Path.

---

## Methodology
All strategies were tested under identical Monte Carlo conditions:
*   **Corpus:** ₹4.50 Crores
*   **Annual Expenses:** ₹10.00 Lakhs
*   **Horizon:** 50 Years
*   **Inflation:** 7.0% p.a.
*   **Asset Returns (Real):** Cash (-2%), Income (+2%), Equity (+6%) approx.

---

## Strategy Performance Ranking

| Rank | Strategy | Best Allocation | Survival Rate | Description |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | **GlidePath** | Balanced (10/50/40) | **96.0%** | Linearly reduces equity over time. Simple, mathematically efficient. |
| **#1** | **RefillBucket1** | Balanced (10/50/40) | **96.0%** | "Safety First": Prioritizes refilling Cash (B1) from Income/Growth. |
| **#2** | **RefillBucket1** | Growth (5/35/60) | **94.0%** | Handles higher equity volatility well due to safety refill priority. |
| **#3** | **AI_Max_Survival** | Conservative (5/65/30) | **92.0%** | highly defensive. Performs best when playing "Goalkeeper". |
| **#4** | **FixedAllocation** | Balanced (10/50/40) | **90.0%** | "Do Nothing". Rebalances annually to fixed weights. |
| **#5** | **Tactical** | Balanced (10/50/40) | **80.6%** | Market timing based on valuations. Higher risk of "whipsaw". |

---

## Detailed Analysis & Persona Recommendations

### 1. The "Hands-Off" Optimizer
**Recommended Strategy:** **Glide Path** (Balanced Start)
*   **Why:** It topped the charts with 96% survival. It mimics the "Lifecycle Funds" found in the US 401(k) system. It removes decision fatigue by pre-deciding the asset allocation path for the next 50 years.
*   **Pros:** Zero maintenance, mathematically superior, reduces "Sequence of Return" risk naturally as you age.
*   **Cons:** Inflexible. If you live to 105, you might end up with too little equity.

### 2. The "Nervous" Retiree
**Recommended Strategy:** **RefillBucket1 (Safety Refill)**
*   **Why:** Tied for #1 (96%). Psychologically, this is the most comforting strategy. It strictly focuses on "Do I have 3 years of Cash in Bucket 1?". If yes, relax. If no, sell B2/B3 to refill it.
*   **Pros:** Intuitive. You always know your next 3 years are safe.
*   **Cons:** Can be slightly inefficient if it sells equity during a dip just to refill cash (though the simulation shows it handles this surprisingly well).

### 3. The "Defensive" AI User
**Recommended Strategy:** **AI_Max_Survival** (Conservative Alloc)
*   **Why:** 92% Survival. This agent is designed not to maximize wealth, but to **minimize ruin**. It actively checks "Years of Safety" and strictly caps equity if safety is low.
*   **Pros:** Adaptive. It will skip inflation (cut spending) if the portfolio is in trouble, acting as a true "Financial Guardian".
*   **Cons:** Its strict safety rules can cause it to miss out on the full upside of a bull market, leading to a slightly lower "perfect" survival rate than the raw math of Glide Path.

### 4. The "Growth" Seeker
**Recommended Strategy:** **RefillBucket1** with **Growth Allocation (5/35/60)**
*   **Why:** 94% Survival even with 60% Equity!
*   **Insight:** High equity usually increases ruin risk. However, the "Refill Bucket 1" mechanic acts as a volatility damper. It allows you to hold 60% equity because you *know* you structurally prioritize refilling that cash wedge. This is the **best strategy for leaving a large legacy**.

---

## Conclusion

For most users, the battle is between **Glide Path** (for structure) and **Refill Bucket 1** (for psychology).

*   If you want to **"Set it and Forget it"**: Choose **Glide Path**.
*   If you want to **"Sleep Well at Night"**: Choose **Refill Bucket 1**.
*   If you want an **"Active Guardian"**: Choose **AI_Max_Survival** (but keep allocations conservative).

*Disclaimer: These are simulation results based on historical statistical models. Past performance does not guarantee future results.*
