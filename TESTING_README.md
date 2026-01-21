# Retirement Simulator - Strategy Testing Guide 🧪

This project uses **Vitest** to ensure the core rebalancing strategies are mathematically correct and bug-free.

## 🚀 How to Run Tests

### 1. Run All Tests Once
Use this command to run the full suite and exit:
```bash
npm test
```
*Expected Output:* You should see `Tests  6 passed (6)` in green.

### 2. Watch Mode (Development)
Use this command to keep tests running while you edit code. It re-runs automatically on save:
```bash
npm run test:watch
```

## 📋 What is being tested?

The test suite `src/tests/StrategyEngine.test.ts` covers the following "Rock Solid" checks:

### 1. 🛡️ Safety Refill (`RefillBucket1`)
- **Refill Logic**: Verifies that if your specific "Safety Bucket" (Cash) falls below 2 years of expenses, it *immediately* sells Income/Growth assets to refill it.
- **Do Nothing**: Verifies it stays dormant if your cash buffer is already safe.

### 2. 🧠 Custom AI Agent (`AI_Max_Survival`) [CRITICAL]
- **Regression Test**: Specifically tests the "100% Equity" bug. 
- **Scenario**: We simulate a "Crisis" (0 years of safety) and force a customized policy limit (e.g. Max 50% Equity).
- **Verify**: Checks that the AI *actually sells* the equity to get back down to 50%, proving the custom logic is active.

### 3. 🛫 Glide Path (`GlidePath`)
- **Start of Career**: Verifies it maintains aggressive equity (70%) when you have >25 years remaining.
- **End of Career**: Verifies it shifts to conservative equity (50%) when you have <5 years remaining.

### 4. 📈 Tactical Flex (`Tactical`)
- **Buy Low**: Simulates a market crash (-10% return). Checks if the strategy triggers a "Buy Low Opportunity" move to transfer funds from Safe -> Growth.

### 5. Custom AI Permutations (`AI_Max_Survival`) [NEW]
- **Dynamic Policy Validation**: We test 7 distinct scenarios ranging from **Crisis** (<3 years safety) to **Freedom** (>15 years safety).
- **Compliance**: Verifies that the AI respects the exact equity limit for each tier (e.g., 30% in Crisis, 90% in Freedom).
- **Overrides**: Verifies that a "Global Max Equity" override (e.g. User sets 50% max) is strictly respected even if the AI Policy would allow more (e.g. 90%).

### 6. Universal Custom Logic
- **Any Base Strategy**: Verifies that *any* base strategy (Refill, GlidePath, etc.) can be wrapped in a "Custom" configuration.
- **Parameter Injection**: Proves that custom parameters (e.g. changing Refill's safety threshold from 2y to 5y) are correctly injected and obeyed by the underlying engine.

## ❌ Interpreting Failures

If a test fails, you will see a red error message.
- `expected x to be close to y`: The math didn't match. Maybe inflation/expense logic changed?
- `expected [Move] to be defined`: A strategy failed to trigger a trade when it should have.

## 🛠️ Adding New Tests
You can add more cases to `src/tests/StrategyEngine.test.ts`. Use `createMockState` to set up specific portfolio scenarios (e.g., market crashes, huge windfalls) and asserting the `newState.buckets` are what you expect.
