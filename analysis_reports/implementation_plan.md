# Retirement Bucket Survivor - Implementation Plan

## UI/UX Improvements & Polish

## Goal Description
Enhance the user experience by implementing Indian currency formatting (Lakhs/Crores), adding a configuration interface for simulation parameters, and redesigning the funds transfer flow to be more interactive and intuitive.

## User Review Required
> [!NOTE]
> I will be using raw SVGs for icons to avoid adding external dependencies like `lucide-react`.

## Proposed Changes
### Utilities
#### [NEW] [currency.ts](file:///a:/Retirement simulator game/src/utils/currency.ts)
- `formatCurrency(value: number): string` (Auto-formats to Cr/Lakh)
- `parseCurrency(value: number, unit: 'L' | 'Cr'): number`

### Components
#### [NEW] [CurrencyInput.tsx](file:///a:/Retirement simulator game/src/components/CurrencyInput.tsx)
- Input field combined with a unit selector (₹, Lakh, Cr).

#### [NEW] [ConfigModal.tsx](file:///a:/Retirement simulator game/src/components/ConfigModal.tsx)
- Modal to edit `initialCorpus`, `initialExpenses`, and per-bucket `expectedReturn`, `volatility`, and `allocation`.

#### [MODIFY] [App.tsx](file:///a:/Retirement simulator game/src/App.tsx)
- Add "Settings" gear icon.
- Implement "Transfer Mode" state orchestration.

#### [MODIFY] [BucketCard.tsx](file:///a:/Retirement simulator game/src/components/BucketCard.tsx)
- Update to display formatted currency.
- Add "Transfer Out" / "Deposit Here" interactive states.

#### [MODIFY] [ControlPanel.tsx](file:///a:/Retirement simulator game/src/components/ControlPanel.tsx)
- Remove old transfer dropdowns.
- Keep "Advance Year" and "Mission Log".

#### [MODIFY] [SetupForm.tsx](file:///a:/Retirement simulator game/src/components/SetupForm.tsx)
- Use `CurrencyInput` for corpus and expenses.

### Logic
#### [MODIFY] [useGame.ts](file:///a:/Retirement simulator game/src/hooks/useGame.ts)
- Add `updateConfig` function.
- Ensure config changes apply to resets.

## Verification Plan
### Manual Verification
- **Currency**: Verify 1.5 Cr displays as "₹1.50 Cr" and 50 Lakhs as "₹50.00 L".
- **Config**: Change volatility of Bucket 3 -> Restart -> Verify simulation behavior/logs.
- **Transfer**:
    1.  Click "Transfer" on Bucket 1.
    2.  Click "Deposit" on Bucket 2.
    3.  Enter 5 Lakhs.
    4.  Verify balances update correctly.

## Gamification & Visualization

## Goal Description
Make the simulation "fun and engaging" by adding a burn-down chart, customizable survival duration, visible expense tracking, and animations for cash flow and milestones.

## User Review Required
> [!NOTE]
> I need to install `recharts` for the burn-down graph and `framer-motion` for the animations to achieve the "engaging" feel requested.

## Proposed Changes
### Dependencies
- `npm install recharts framer-motion`

### Logic
#### [MODIFY] [types.ts](file:///a:/Retirement simulator game/src/types/index.ts)
- Add `survivalYears` to `GameConfig`.

#### [MODIFY] [GameEngine.ts](file:///a:/Retirement simulator game/src/engine/GameEngine.ts)
- Update `INITIAL_CONFIG` and logic to use `config.survivalYears`.

### Components
#### [NEW] [BurnDownChart.tsx](file:///a:/Retirement simulator game/src/components/BurnDownChart.tsx)
- Visualization of Total Wealth vs. Time.

#### [NEW] [ExpenseReveal.tsx](file:///a:/Retirement simulator game/src/components/ExpenseReveal.tsx)
- Animated component to show "Yearly Expenses" being deducted from Bucket 1.

#### [NEW] [MilestoneCelebration.tsx](file:///a:/Retirement simulator game/src/components/MilestoneCelebration.tsx)
- Overlay for celebrating 5/10/15 year marks.

#### [MODIFY] [SetupForm.tsx](file:///a:/Retirement simulator game/src/components/SetupForm.tsx)
- Add "Survival Years" input.

#### [MODIFY] [App.tsx](file:///a:/Retirement simulator game/src/App.tsx)
- Integrate Chart and Expense Display.
- Trigger animations on "Advance Year".

## Visual Polish & Refinement

## Goal Description
Transform the "utilitarian" dashboard into a premium, modern "fintech" style gamified app. Focus on aesthetics, rich gradients, better typography, and "juicy" interactions.

## Proposed Changes
### Styles
#### [MODIFY] [main.css](file:///a:/Retirement simulator game/src/styles/main.css)
- **Background**: Replace flat dark blue with a deep "Space/Nebula" radial gradient.
- **Glassmorphism**: Update `.glass-panel` to have a more sophisticated border (white/10%), smoother shadow, and higher blur.
- **Typography**: Import a modern font (e.g., 'Inter' or 'Outfit') via Google Fonts if not present, or style existing system fonts with better weights.
- **Buttons**: Create `.btn-primary` (glowing action) and `.btn-ghost` (subtle).
- **Gradients**: Define rich gradients for Accents (Cyan -> Blue), Success (Emerald -> Teal), Warning (Amber -> Orange).

### Components
#### [MODIFY] [BucketCard.tsx](file:///a:/Retirement simulator game/src/components/BucketCard.tsx)
- **Visuals**: Remove heavy borders. Use deeper glass background for the container.
- **Liquid Fill**: Enhance the "water" fill with a gradient and a top border/meniscus effect.
- **Typography**: Make the Balance (₹ Cr) the hero text (large, bold). Make labels (Alloc, ROI) subtle/uppercase.

#### [MODIFY] [ControlPanel.tsx](file:///a:/Retirement simulator game/src/components/ControlPanel.tsx)
- **Main Action**: Style "Advance to Year X" button as a large, wide, glowing "Next Level" button.

#### [MODIFY] [App.tsx](file:///a:/Retirement simulator game/src/App.tsx)
- **Header**: Simplify. Remove "Year X" from title area if it's redundant (it's in the log or milestone). Or make it a sticky glass header.

#### [MODIFY] [BurnDownChart.tsx](file:///a:/Retirement simulator game/src/components/BurnDownChart.tsx)
- **Colors**: Update chart lines to match new gradient tokens. Use a gradient fill for the area under the curve if possible.

## Verification Plan
### Manual Verification
1.  **Visual Check**: Open `http://localhost:5174/`.
2.  **Aesthetics**: Verify the background is not flat. Verify panels look like distinct glass layers.
3.  **Readability**: Ensure text contrast is high on the new semi-transparent backgrounds.
4.  **Interactions**: Hover over buttons to check for "glow" or lift effects.

## Goal Description
Build an immersive, educational "game" that simulates retirement planning using the Bucket Strategy. The user acts as the retiree managing their portfolio against market volatility, making critical decisions on when to rebalance or refill their cash bucket.

## User Review Required
- **Design Metaphor**: I am proposing a "Cockpit" or "Command Center" aesthetic with glassmorphism. Is this aligned with "fun and engaging"?
- **Game Mechanics**: I am adding a "Game Over" condition (Cash Bucket Empty).

## Proposed Changes

### Project Structure (New)
I will initialize a standard React+Vite+TS structure.

### Core Logic (`src/engine`)
- **`MarketSimulator.ts`**: Generates market returns (Normal Distribution).
- **`BucketManager.ts`**: Handles logic for 3 buckets (Cash, Income, Growth).
  - Cash: 0% real return (matches inflation roughly), 0 volatility.
  - Income: Moderate return, low volatility.
  - Growth: High return, high volatility.

### UI Components (`src/components`)
- **`SetupWizard.tsx`**: High-quality form for initial inputs.
- **`Dashboard.tsx`**: Main game view.
- **`BucketCard.tsx`**: Visual representation of a bucket (fill level animation).
- **`YearSummary.tsx`**: Modal/Overlay showing what happened this year.

### Styles
- Vanilla CSS with CSS Variables for theming.
- Focus on `backdrop-filter`, gradients, and smooth transitions.

## Verification Plan
### Automated Tests
- Unit tests for `MarketSimulator` to ensure statistical properties (mean/std dev) are roughly correct over large samples.
- Unit tests for `BucketLogic` to ensure money doesn't disappear during transfers.

### Manual Verification
- Walkthrough of the full "life" (e.g., 30 years).
- Verify "Game Over" states.
- Verify "Win" states (Corpus lasts 30+ years).
