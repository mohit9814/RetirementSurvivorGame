
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../funds.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // 1. Top 10 Fund Houses by Average Sharpe Ratio (min 5 funds)
    console.log('\n--- TOP 10 FUND HOUSES (Risk-Adjusted Performance) ---');
    db.all(`
        SELECT fund_house, COUNT(*) as count, AVG(sharpe) as avg_sharpe, AVG(mean_return) as avg_ret
        FROM funds 
        WHERE sharpe > 0
        GROUP BY fund_house
        HAVING count >= 5
        ORDER BY avg_sharpe DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) console.error(err);
        console.table(rows);

        // 2. Best Funds (Run inside callback to ensure sequence if serialize doesn't guarantee callback order for logging)
        console.log('\n--- BEST FUNDS (High Risk/Reward, Stable, Downside Protected) ---');
        console.log('Criteria: Positive Months > 50%, Volatility < 15%, Max Drawdown > -20%');

        db.all(`
            SELECT fund_name, category, sharpe, sortino, mean_return, volatility, max_drawdown, positive_months
            FROM funds
            WHERE positive_months > 0.50
            AND volatility < 0.15
            AND max_drawdown > -0.20
            ORDER BY sharpe DESC
            LIMIT 20
        `, (err2, rows2) => {
            if (err2) console.error(err2);
            console.log(`Found ${rows2 ? rows2.length : 0} funds matching criteria.`);
            if (rows2 && rows2.length > 0) {
                console.table(rows2);
            } else {
                console.log('No funds found. Checking data samples...');
                db.each("SELECT fund_name, positive_months, volatility FROM funds LIMIT 3", (e, r) => console.log(r));
            }
        });
    });
});
