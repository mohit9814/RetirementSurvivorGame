# Glide Path Strategy Algorithm

## Overview
The **Glide Path** strategy automates the reduction of portfolio risk as the retirement timeline progresses. Unlike static allocations, it dynamically shifts capital from high-risk **Growth assets (Bucket 3)** to safer **Income assets (Bucket 2)** based on the remaining years in the simulation (the "Survival Horizon").

The goal is to maximize growth during the early years when time is abundant, and prioritize capital preservation as the end of the plan approaches.

---

## 1. Core Logic: Linear De-risking

The strategy defines a **Target Equity Allocation** (percentage of Total Wealth held in Bucket 3) that evolves based on `Years Remaining`.

**Formula**:
`Years Remaining = Total Survival Years - Current Year`

The allocation follows a linear interpolation between two fixed points:

| Phase | Condition (Years Remaining) | Target Equity Allocation | Behavior |
| :--- | :--- | :--- | :--- |
| **Aggressive** | **≥ 25 Years** | **70%** (Max) | Maintains high exposure to growth to combat inflation and build corpus. |
| **Glide** | **Between 5 and 25 Years** | **50% to 70%** (Linear) | Gradually reduces equity exposure. The target drops by **1% per year** (approx) as time passes. |
| **Conservative** | **≤ 5 Years** | **50%** (Min) | Locks in a conservative floor to minimize sequence of returns risk in the final years. |

### Interpolation Formula
For the **Glide Phase**:
```text
Range = 25 - 5 = 20 Years
Position = Years Remaining - 5
Target Equity = 50% + (20%) * (Position / 20)
```

---

## 2. Execution Steps

The rebalancing logic runs once at the beginning of each simulation year.

### Step A: Equity Rebalancing (Growth <-> Income)
The engine calculates the `Target Growth Amount` (`Total Wealth * Target Equity`) and compares it to the `Current Growth Balance`.

1.  **If Overweight (Too much Equity)**:
    *   **Condition**: `Current Growth Balance > Target Growth Amount`
    *   **Action**: Sell the *entire excess* from **Bucket 3 (Growth)**.
    *   **Destination**: Move proceeds to **Bucket 2 (Income)**.
    *   **Log Event**: `Glide Path Adjustment (<Target>%)`.

2.  **If Underweight (Too little Equity)**:
    *   **Condition**: `Current Growth Balance < Target Growth Amount`
    *   **Action**: Buy the *entire shortfall* into **Bucket 3 (Growth)**.
    *   **Source**: Move funds from **Bucket 2 (Income)**.
    *   **Constraint**: Cannot move more than is available in Bucket 2.
    *   **Log Event**: `Glide Path Rebalance Up`.

### Step B: Safety Floor Enforcement (Income -> Cash)
After adjusting the equity/debt mix, the strategy ensures near-term liquidity is secure.

1.  **Rule**: **Bucket 1 (Cash)** must always hold at least **1 year of inflation-adjusted expenses**.
2.  **Check**: `Bucket 1 Balance < Annual Expenses`?
3.  **Action**:
    *   Calculate `Deficit`.
    *   Move funds from **Bucket 2 (Income)** to **Bucket 1 (Cash)** to cover the deficit.
    *   **Constraint**: Limited by Bucket 2 balance.
    *   **Log Event**: `Safety Top-up`.

---

## 3. Summary of Configuration
The current implementation uses hardcoded thresholds within the engine logic:

*   **Max Equity**: 70%
*   **Min Equity**: 50%
*   **Aggressive Threshold**: 25 Years Remaining
*   **Conservative Threshold**: 5 Years Remaining

---

## Appendix: "Tactical" Strategy Variant
*Note: The "Tactical" strategy is a separate mode but contains a similar concept.*

The **Tactical** strategy implements a simplified "Tactical Glide Path":
*   **Logic**: Reduces the target equity allocation by a fixed **0.5% per year** starting from the initial configuration.
*   **Formula**: `Target = Initial Allocation - (Current Year * 0.005)`
*   **Floor**: Never drops below **30%** equity.
*   This is distinct from the primary `GlidePath` strategy described above.
