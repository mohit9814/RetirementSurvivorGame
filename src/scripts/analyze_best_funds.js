
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../funds.db');

const db = new sqlite3.Database(DB_PATH);

console.log('--- SEARCHING FOR BEST FUNDS ---');
console.log('Criteria: Positive Months > 50%, Vol < 15%, Max DD > -20%, Sorted by Sharpe');

// Debug: Check total count
db.get("SELECT COUNT(*) as c FROM funds", (err, row) => console.log(`Total Funds in DB: ${row.c}`));

// Debug: Check sample values
db.all("SELECT fund_name, positive_months, volatility, max_drawdown FROM funds LIMIT 5", (err, rows) => {
    console.log('--- SAMPLE DATA ---');
    console.table(rows);
});

// Allowed Categories from User Image
const ALLOWED_CATEGORIES = [
    'Equity - Flexi Cap',
    'Equity - Large & Mid Cap',
    'Equity - Large Cap',
    'Equity - Mid Cap',
    'Equity - Multi Cap',
    'Equity - Small Cap',
    'Hybrid - Aggressive',
    'Hybrid - Arbitrage',
    'Hybrid - Balanced Advantage',
    'Hybrid - Conservative',
    'Hybrid - Equity Savings'
];

const whereClause = `
    WHERE category IN (${ALLOWED_CATEGORIES.map(c => `'${c}'`).join(',')})
      AND positive_months > 0.50
      AND volatility < 0.15
      AND max_drawdown > -0.20
`;

db.all(`
    SELECT fund_name, category, sharpe, sortino, mean_return, volatility, max_drawdown, positive_months
    FROM funds
    ${whereClause}
    ORDER BY sharpe DESC
    LIMIT 25
`, (err, rows) => {
    if (err) console.error(err);
    console.log(`\n--- RESULTS (Filtered): ${rows ? rows.length : 0} FUNDS FOUND ---`);
    if (rows && rows.length > 0) {
        console.log(JSON.stringify(rows, null, 2));
    } else {
        console.log("No matches found in allowed categories. Widen criteria?");
    }
});
