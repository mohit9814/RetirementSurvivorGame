
import { initializeGame, advanceYear } from '../engine/GameEngine';
import { INITIAL_CONFIG } from '../engine/GameEngine';
import type { GameState, GameConfig } from '../types';

const SIMULATIONS = 20; // Fast enough for TSX, statistically useful
const YEARS = 40;

const STRATEGIES = ['None', 'RefillBucket1', 'Tactical', 'GlidePath', 'FixedAllocation', 'AI_Max_Survival'];

interface SimResult {
    strategy: string;
    survived: boolean;
    yearsLasted: number;
    endingWealth: number;
    minWealth: number;
}

console.log(`Starting Benchmark: ${SIMULATIONS} simulations over ${YEARS} years...`);

const results: Record<string, SimResult[]> = {};

// Initialize results container
STRATEGIES.forEach(s => results[s] = []);

// Suppress Logs for Speed
const originalLog = console.log;
console.log = () => { };

for (let i = 0; i < SIMULATIONS; i++) {
    if (i % 10 === 0) process.stdout.write('.');

    // Create a base config
    const baseConfig = { ...INITIAL_CONFIG, survivalYears: YEARS };

    // We need to ensure market returns are identical for fair comparison.
    // The current GameEngine architecture relies on 'simulateNextYearPhysics' generating randoms.
    // However, my recent "GOD MODE" update to GameEngine *already* does this synchronization!
    // So, I can just run ONE game with "AI_Max_Survival" (or any) and use the `shadowStrategies` feature!
    // Shadow strategies are automatically populated in `initializeGame` for GOD Mode.
    // Wait, `initializeGame` populates shadows for ALL other strategies if we pick one.

    // So if I pick 'AI_Max_Survival' as the main, the shadows will be Refill, Tactical, Glide, Fixed.
    // 'None' might not be in the default shadow list in GameEngine.ts (I should check, but it's fine).

    // Let's modify the config to ensure shadows are active.
    // Actually, I'll just rely on the existing shadow logic. The `initializeGame` in GameEngine.ts adds: 
    // ['RefillBucket1', 'GlidePath', 'FixedAllocation', 'AI_Max_Survival', 'Tactical']
    // So if I run 'None', I might get shadows? 
    // Let's look at GameEngine.ts logic: "strategiesToCompare.forEach..."
    // Yes.

    let game = initializeGame({ ...baseConfig, rebalancingStrategy: 'None' } as any);

    // We need to manually inject shadows if 'None' isn't triggering the right set, 
    // but the code says: strategiesToCompare = ['RefillBucket1', 'GlidePath', 'FixedAllocation', 'AI_Max_Survival', 'Tactical'];
    // So 'None' will have ALL of them as shadows. Perfect.

    // Run the game to completion
    while (!game.isGameOver && game.currentYear < YEARS) {
        game = advanceYear(game);
    }

    // Collect Data for Main ('None')
    results['None'].push({
        strategy: 'None',
        survived: !game.gameOverReason || game.gameOverReason.includes('Victory'),
        yearsLasted: game.currentYear,
        endingWealth: game.buckets.reduce((s, b) => s + b.balance, 0),
        minWealth: game.history.reduce((min, h) => Math.min(min, h.totalWealth), Infinity)
    });

    // Collect Data for Shadows
    if (game.shadowStrategies) {
        Object.values(game.shadowStrategies).forEach(shadow => {
            const strat = shadow.config.rebalancingStrategy;
            results[strat].push({
                strategy: strat,
                survived: !shadow.gameOverReason || shadow.gameOverReason.includes('Victory'),
                yearsLasted: shadow.currentYear,
                endingWealth: shadow.buckets.reduce((s, b) => s + b.balance, 0),
                minWealth: shadow.history.reduce((min, h) => Math.min(min, h.totalWealth), Infinity)
            });
        });
    }
}

console.log = originalLog;
console.log('\nProcessing Results...');

// Aggregation
console.log('| Strategy | Survival Rate | Median Wealth | Min Wealth (Worst Case) | Avg Years |');
console.log('|---|---|---|---|---|');

STRATEGIES.forEach(strat => {
    const data = results[strat];
    if (!data || data.length === 0) return;

    const survivalRate = (data.filter(r => r.survived).length / SIMULATIONS) * 100;

    const wealths = data.map(r => r.endingWealth).sort((a, b) => a - b);
    const medianWealth = wealths[Math.floor(wealths.length / 2)];

    const minWealths = data.map(r => r.minWealth).sort((a, b) => a - b);
    const worstCase = minWealths[0]; // Absolute worst drawdown across all sims

    const avgYears = data.reduce((s, r) => s + r.yearsLasted, 0) / SIMULATIONS;

    console.log(`| ${strat} | ${survivalRate.toFixed(1)}% | ${(medianWealth / 10000000).toFixed(2)} Cr | ${(worstCase / 10000000).toFixed(2)} Cr | ${avgYears.toFixed(1)} |`);
});
