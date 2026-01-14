
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
    // 1. Calculate Category Benchmarks
    db.all(`
        SELECT category, 
               AVG(rolling_5y_mean) as avg_return, 
               AVG(max_drawdown) as avg_drawdown,
               AVG(sharpe) as avg_sharpe
        FROM funds
        WHERE category IN (${ALLOWED_CATEGORIES.map(c => `'${c}'`).join(',')})
        GROUP BY category
    `, (err, benchmarks) => {
        if (err) { console.error(err); return; }

        const benchMap = {};
        benchmarks.forEach(b => benchMap[b.category] = b);

        // 2. Score Every Fund
        db.all(`
            SELECT fund_name, category, years, 
                   rolling_5y_mean, max_drawdown, sharpe, volatility
            FROM funds
            WHERE category IN (${ALLOWED_CATEGORIES.map(c => `'${c}'`).join(',')})
        `, (err2, funds) => {
            if (err2) console.error(err2);

            const scoredFunds = funds.map(f => {
                const bm = benchMap[f.category];
                if (!bm) return null;

                let consistencyScore = 0;
                let protectionScore = 0;
                let efficiencyScore = 0;
                let longevityScore = 0;

                // 1. Consistency (40pts) - Based on Rolling 5Y Return vs Benchmark
                if (f.rolling_5y_mean > bm.avg_return * 1.10) consistencyScore = 40;
                else if (f.rolling_5y_mean > bm.avg_return * 1.05) consistencyScore = 30;
                else if (f.rolling_5y_mean > bm.avg_return) consistencyScore = 20;

                // 2. Protection (30pts) - Based on Max Drawdown vs Benchmark
                // Drawdown is negative, so "higher" (less negative) is better.
                // If Fund (-30) > Avg (-40), it protected better.
                if (f.max_drawdown > bm.avg_drawdown * 0.9) protectionScore = 30; // e.g. -30 > -36 (0.9 * -40) ? No. Wait. -40 * 0.9 = -36. -30 > -36 is True.
                else if (f.max_drawdown > bm.avg_drawdown) protectionScore = 20;

                // 3. Efficiency (20pts) - Sharpe Ratio
                if (f.sharpe > 0.8) efficiencyScore = 20;
                else if (f.sharpe > 0.5) efficiencyScore = 10;

                // 4. Longevity (10pts) - Age
                if (f.years >= 10) longevityScore = 10;

                const totalScore = consistencyScore + protectionScore + efficiencyScore + longevityScore;

                // Exclude Foreign Equity Outliers if necessary (User specific)
                if (f.fund_name.includes('Parag Parikh Flexi Cap')) return null;

                return {
                    name: f.fund_name,
                    category: f.category,
                    score: totalScore,
                    breakdown: { C: consistencyScore, P: protectionScore, E: efficiencyScore, L: longevityScore },
                    stats: { ret: (f.rolling_5y_mean * 100).toFixed(1), vol: (f.volatility * 100).toFixed(1), dd: (f.max_drawdown * 100).toFixed(1) }
                };
            }).filter(f => f !== null);

            // Group by Category and find Top 3
            console.log("# 🏆 Top 3 Funds by Category (The Survivor Score)\n");

            ALLOWED_CATEGORIES.forEach(cat => {
                const catFunds = scoredFunds.filter(f => f.category === cat);
                catFunds.sort((a, b) => b.score - a.score);

                const top3 = catFunds.slice(0, 3);

                if (top3.length > 0) {
                    console.log(`## ${cat}`);
                    console.table(top3.map(f => ({
                        Name: f.name.replace(' - Direct Plan - Growth', '').replace('Option', '').trim().substring(0, 35),
                        Score: f.score,
                        'Ret%': f.stats.ret,
                        'Vol%': f.stats.vol,
                        'DD%': f.stats.dd,
                        'Brk': `C:${f.breakdown.C} P:${f.breakdown.P} E:${f.breakdown.E} L:${f.breakdown.L}`
                    })));
                    console.log('\n');
                }
            });

        });
    });
});
