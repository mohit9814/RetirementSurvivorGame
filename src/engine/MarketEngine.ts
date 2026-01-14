/**
 * Generates a normally distributed random number (Gaussian).
 * Uses Box-Muller transform.
 * @param mean Mean of the distribution
 * @param stdDev Standard deviation
 */
export function generateNormalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z * stdDev + mean;
}

/**
 * Simulates a market year for a given asset class parameters.
 * @param expectedReturn Mean annual return (e.g., 0.10 for 10%)
 * @param volatility Standard deviation (e.g., 0.20 for 20%)
 * @returns The simulated return percentage for the year
 */
export function simulateYearlyReturn(expectedReturn: number, volatility: number): number {
    // If volatility is 0 (Fixed Income), just return the rate
    if (volatility === 0) return expectedReturn;

    return generateNormalRandom(expectedReturn, volatility);
}

export const MARKET_EVENTS = {
    CRASH: { threshold: -0.20, name: "Market Crash!", description: "Panic selling grips the market." },
    CORRECTION: { threshold: -0.10, name: "Correction", description: "Markets dip significantly." },
    BOOM: { threshold: 0.20, name: "Boom!", description: "Irrational exuberance drives prices up." },
};

export function getMarketEventDescription(marketReturn: number): string | undefined {
    if (marketReturn <= MARKET_EVENTS.CRASH.threshold) return MARKET_EVENTS.CRASH.name;
    if (marketReturn <= MARKET_EVENTS.CORRECTION.threshold) return MARKET_EVENTS.CORRECTION.name;
    if (marketReturn >= MARKET_EVENTS.BOOM.threshold) return MARKET_EVENTS.BOOM.name;
    return undefined;
}
