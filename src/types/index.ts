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
}

export interface RebalancingEvent {
    year: number;
    fromBucketIndex: number;
    toBucketIndex: number;
    amount: number;
    reason: 'Safety Refill' | 'Profit Skimming' | 'Buy Low Opportunity' | 'Glide Path Adjustment' | 'Glide Path Rebalance Up' | 'Safety Top-up' | 'Deploying Idle Cash' | 'Allocation Reset';
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
}

export interface GameConfig {
    initialCorpus: number;
    initialExpenses: number;
    inflationRate: number;
    survivalYears: number; // Target duration
    enableTaxation: boolean; // Enable/Disable tax simulation
    rebalancingStrategy: 'None' | 'RefillBucket1' | 'Tactical' | 'GlidePath';
    customRebalancingTargetYears?: number; // For Custom Strategy
    tacticalCashBufferYears?: number; // For Tactical Strategy (Safety)
    bucketConfigs: BucketConfig[];
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
