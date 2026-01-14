# 🎮 Retirement Survivor: The 50-Year Simulation

> *"Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't, pays it." — Albert Einstein*

## 🌟 Vision & Goal
**Retirement Survivor** is not just a calculator—it's a **Survival Game**. 

Most retirement calculators use simple linear averages (e.g., "Expect 10% returns forever"). This leads to disaster because it ignores **Sequence of Returns Risk**—the danger that the market crashes *just* when you retire.

**The Goal**: Can your portfolio survive 50 years of inflation, market crashes (2000, 2008, 2020), and tax events without hitting ₹0? 

## 🛡️ The Strategy: 3-Bucket System
Instead of keeping all money in one pot, we simulate a robust **Bucket Strategy** to weather storms:

1.  **Bucket 1 (Cash/Liquid)**: 
    *   **Role**: Safety Net. 
    *   **Asset**: Cash/FDs.
    *   **Goal**: Holds 2-3 years of living expenses. Immune to market crashes.
2.  **Bucket 2 (Income)**: 
    *   **Role**: Stability & Yield. 
    *   **Asset**: Debt/Bonds/Hybrid Funds.
    *   **Goal**: Generates steady income to refill Bucket 1.
3.  **Bucket 3 (Growth)**: 
    *   **Role**: Wealth Engine. 
    *   **Asset**: Equity Mutual Funds.
    *   **Goal**: Beats inflation over decades. High volatility, high reward.

## 🧞‍♂️ The "Einstein" Rebalancing Engine
The core of the simulation is the **Rebalancing Agent** (represented by the Genie/Einstein wizard). It automates complex financial decisions every year:

*   **Safety Refill**: If Bucket 1 drops below 2 years of expenses, it intelligently sells from B2 or B3.
*   **Profit Skimming**: If B3 (Equity) rallies hard (e.g., +50%), it sells the "cream" and moves it to safety (B1/B2).
*   **Buy Low**: If the market crashes, it uses safe cash from B2 to buy cheap Equity in B3.
*   **Glide Path**: (Optional) Slowly reduces Equity exposure as you age (De-risking).

## 🚀 Key Features
*   **Historical Simulation**: Runs against realistic market data (volatility, crashes).
*   **Tactical De-Risking**: Watch your Equity allocation (Purple Chart) slowly glide down as you age.
*   **Visual Analytics**:
    *   **Burn Down Chart**: Will you run out of money?
    *   **Allocation %**: Track your asset mix over 100+ years.
    *   **Bucket Visuals**: See precise money flow, tax hits (💸), and growth.
*   **Snail Mode**: Slow down time to 0.5x to watch every single transaction and market move.

## 🛠️ Tech Stack
*   **Frontend**: React (Vite) + TypeScript
*   **Charts**: Recharts (Custom composed charts for wealth & allocation)
*   **Styles**: Pure CSS Modules + Glassmorphism Design System
*   **Animation**: CSS Keyframes + Framer-like transitions

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)

### Installation
1.  Clone the repo:
    ```bash
    git clone https://github.com/mohit9814/RetirementSurvivorGame.git
    cd RetirementSurvivorGame
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### How to Play
1.  Start the simulator:
    ```bash
    npm run dev
    ```
2.  Open your browser (usually `http://localhost:5173`).
3.  **Configure Your Life**:
    *   Set **Initial Corpus** (e.g., ₹5 Cr).
    *   Set **Yearly Expenses** (e.g., ₹12 Lakhs).
    *   Choose a **Strategy** (Tactical, Glide Path, etc.).
4.  Hit **Start Game** ▶️.
5.  Watch the years fly by!
    *   Hover over buckets to see returns.
    *   Switch charts to see your Glide Path.
    *   Try to survive until year 50!

---
*Built with ❤️ for Financial Independence.*
