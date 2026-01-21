export type BucketType = 'Cash' | 'Income' | 'Growth';

export interface BucketConfig {
    type: BucketType;
    name: string;
    expectedReturn: number; // Percentage, e.g., 0.04
    volatility: number;     // Standard deviation, e.g., 0.15
    allocation: number;     // Initial allocation percentage (0-1)
}

export interface BucketState {
    type: BucketType;
    name: string;
    balance: number;
    lastYearReturn: number;
}

export interface YearlyResult {
    year: number;
    buckets: BucketState[];
    totalWealth: number;
    withdrawn: number;
    inflation: number;
    portfolioReturn: number; // Overall portfolio return percentage for this year
    taxPaid: number; // Total tax deducted this year
    marketEvent?: string; // e.g., "Crash", "Boom"
    rebalancingMoves?: RebalancingEvent[];
    spendingCutApplied?: boolean; // True if inflation adjustment was skipped due to poor returns
    strategyChange?: string; // Log of strategy switches
}

export interface RebalancingEvent {
    year: number;
    fromBucketIndex: number;
    toBucketIndex: number;
    amount: number;
    reason: 'Safety Refill' | 'Profit Skimming' | 'Buy Low Opportunity' | 'Glide Path Adjustment' | 'Glide Path Rebalance Up' | 'Safety Top-up' | 'Deploying Idle Cash' | 'Allocation Reset' | 'AI Adjustment';
    taxIncurred?: number;
}

export interface GameState {
    currentYear: number;
    startYear: number;
    maxYears: number;
    buckets: BucketState[];
    history: YearlyResult[];
    config: GameConfig;
    isGameOver: boolean;
    gameOverReason?: string;
    sessionId: string; // Unique identifier for this run
    shadowStrategies?: Record<string, GameState>; // Parallel simulations (GOD Mode)
}

export interface GameConfig {
    initialCorpus: number;
    initialExpenses: number;
    inflationRate: number;
    survivalYears: number; // Target duration
    enableTaxation: boolean; // Enable/Disable tax simulation
    rebalancingStrategy: 'None' | 'RefillBucket1' | 'Tactical' | 'GlidePath' | 'FixedAllocation' | 'AI_Max_Survival' | 'Custom';
    customStrategy?: CustomStrategyConfig; // Configuration for Custom Strategy
    showInterventionPopups?: boolean; // Toggle for AI/Strategy notifications
    bucketConfigs: BucketConfig[];
}

export interface CustomStrategyConfig {
    baseStrategy: 'RefillBucket1' | 'Tactical' | 'GlidePath' | 'FixedAllocation' | 'AI_Max_Survival';
    params: RebalancingParams;
}

export interface AIPolicyConfig {
    lt3: number;      // < 3 Years
    t3to5: number;    // 3 - 5 Years
    t5to7: number;    // 5 - 7 Years
    t7to10: number;   // 7 - 10 Years
    t10to12: number;  // 10 - 12 Years
    t12to15: number;  // 12 - 15 Years
    gt15: number;     // 15+ Years
}

export interface RebalancingParams {
    // Common / Refill / Tactical
    safetyThresholdYears?: number; // e.g. 2 or 3

    // Tactical Specific
    maxCashBufferMultiplier?: number; // e.g. 1.5
    tacticalEquityTargetStart?: number; // e.g. 0.60
    tacticalEquityTargetEnd?: number; // e.g. 0.30

    // Glide Path Specific
    gpStartEquity?: number; // e.g. 0.70
    gpEndEquity?: number; // e.g. 0.50
    gpAggressiveYears?: number; // e.g. 25
    gpConservativeYears?: number; // e.g. 5

    // AI / Custom Params
    aiSafeYears?: number;
    aiMaxEquity?: number;
    aiMinEquity?: number;
    aiPolicy?: AIPolicyConfig; // Granular Policy
}

export interface LeaderboardEntry {
    id: string; // Unique ID (timestamp + random)
    username: string;
    timestamp: string; // ISO Date
    survivalYears: number;
    maxYears: number;
    endingWealth: number;
    score: number;
    outcome: 'Victory' | 'Bankrupt';
}
