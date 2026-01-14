import type { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'retirement_sim_leaderboard_v1';

export const saveGameResult = (entry: LeaderboardEntry): void => {
    try {
        const existing = getLeaderboard();

        // Upsert Logic: Check if ID exists
        const index = existing.findIndex(e => e.id === entry.id);
        let updated;

        if (index >= 0) {
            // Update existing entry
            updated = [...existing];
            updated[index] = entry;
        } else {
            // Add new entry
            updated = [...existing, entry];
        }

        // Sort by score descending (Primary), then date descending (Secondary)
        updated.sort((a, b) => b.score - a.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Keep top 100
        const top100 = updated.slice(0, 100);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(top100));
    } catch (e) {
        console.error("Failed to save game result", e);
    }
};

export const getLeaderboard = (): LeaderboardEntry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load leaderboard", e);
        return [];
    }
};

export const getUserHistory = (username: string): LeaderboardEntry[] => {
    const all = getLeaderboard();
    return all.filter(entry => entry.username.toLowerCase() === username.toLowerCase());
};

export const calculateScore = (survivalYears: number, totalWealth: number, maxYears: number): number => {
    // Base score for surviving
    let score = survivalYears * 1000;

    // Bonus for wealth if you survived the full term
    if (survivalYears === maxYears) {
        score += Math.floor(totalWealth / 100000); // 1 point for every 1 Lakh remaining
    }

    return score;
};

const CONFIG_KEY = 'retirement_sim_config_v1';

export const saveConfig = (config: any): void => {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.error("Failed to save config", e);
    }
};

export const loadConfig = (): any | null => {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error("Failed to load config", e);
        return null;
    }
};
