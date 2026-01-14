
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../funds_v2.db');

const db = new sqlite3.Database(DB_PATH);

const ALLOWED_CATEGORIES = [
    'Equity - Flexi Cap', 'Equity - Large & Mid Cap', 'Equity - Large Cap',
    'Equity - Mid Cap', 'Equity - Multi Cap', 'Equity - Small Cap',
    'Hybrid - Aggressive', 'Hybrid - Arbitrage', 'Hybrid - Balanced Advantage',
    'Hybrid - Conservative', 'Hybrid - Equity Savings'
];

db.serialize(() => {
    // 1. Calculate Category Averages (Benchmarks)
    // We only care about funds with > 10 years history for the benchmark to be high quality? 
    // Or do we compare against ALL funds? Usually peer average includes all.
    // Let's compare against all to see who beats the general crowd.
    // But for SELECTION, we strictly filter years > 10.

    db.all(`
        SELECT category, 
               AVG(rolling_3y_mean) as cat_avg_3y, 
               AVG(rolling_5y_mean) as cat_avg_5y,
               AVG(volatility) as cat_avg_vol
        FROM funds
        WHERE category IN (${ALLOWED_CATEGORIES.map(c => `'${c}'`).join(',')})
        GROUP BY category
    `, (err, benchmarks) => {
        if (err) { console.error(err); return; }

        const benchMap = {};
        benchmarks.forEach(b => benchMap[b.category] = b);

        console.log('\n--- CATEGORY BENCHMARKS (Rolling 3Y / 5Y / Vol) ---');
        console.table(benchmarks);

        // 2. Identify Consistent Winners > 10 Years Age
        // Criteria: 
        // - Age >= 10
        // - Rolling 5y Mean > Category Avg 5y (Strict Consistency)
        // - Volatility < Category Avg Vol (Lower Risk)
        // - Positive Months > 0.60 (High Consistency)

        console.log('\n--- CONSISTENT VETERANS (>10 Years, Beat Peers in Risk & Return) ---');

        db.all(`
            SELECT fund_name, category, years, 
                   rolling_3y_mean, rolling_5y_mean, volatility, 
                   positive_months, max_drawdown
            FROM funds
            WHERE years >= 10
            AND category IN (${ALLOWED_CATEGORIES.map(c => `'${c}'`).join(',')})
        `, (err2, funds) => {
            if (err2) console.error(err2);

            const winners = funds.filter(f => {
                // User Exclusion: Parag Parikh Flexi Cap (Foreign equity outlier)
                if (f.fund_name.includes('Parag Parikh Flexi Cap')) return false;

                const bm = benchMap[f.category];
                if (!bm) return false;

                // Check 1: Return Outperformance (Beats Peer Avg on 5Y Rolling)
                const beatsReturn = f.rolling_5y_mean > bm.cat_avg_5y;

                // Check 2: Risk Control (Volatility lower or equal to Peer Avg)
                // Relax slightly: roughly equal is ok. Let's say <= 1.05 * avg
                const controlsRisk = f.volatility <= (bm.cat_avg_vol * 1.05);

                return beatsReturn && controlsRisk;
            }).map(f => {
                const bm = benchMap[f.category];
                return {
                    ...f,
                    alpha_5y: (f.rolling_5y_mean - bm.cat_avg_5y).toFixed(4),
                    risk_score: (f.volatility / bm.cat_avg_vol).toFixed(2)
                };
            });

            // Sort by Alpha (Outperformance)
            winners.sort((a, b) => b.rolling_5y_mean - a.rolling_5y_mean);

            console.log(JSON.stringify(winners.slice(0, 30), null, 2));
        });
    });
});
