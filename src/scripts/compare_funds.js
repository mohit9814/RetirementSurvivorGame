
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../funds_v2.db');

const db = new sqlite3.Database(DB_PATH);

const FUNDS_TO_COMPARE = [
    'Bandhan Core Equity Fund - Direct Plan - Growth', // User said "Bandhan Large - Mid Cap", actual name might be "Bandhan Core Equity" (it's their Large & Mid fund). I'll check via LIKE.
    'Canara Robeco Large' // "CANARA ROBECO LARGE AND MID CAP FUND - DIRECT PLAN - GROWTH OPTION"
];

const sql = `
    SELECT fund_name, category, years, 
           mean_return, volatility, max_drawdown, sharpe, sortino,
           rolling_1y_mean, rolling_3y_mean, rolling_5y_mean,
           positive_months
    FROM funds
    WHERE fund_name = 'Bandhan Large - Mid Cap Fund - Direct Plan - Growth'
       OR fund_name = 'CANARA ROBECO LARGE AND MID CAP FUND - DIRECT PLAN - GROWTH OPTION'
`;

db.all(sql, (err, rows) => {
    if (err) console.error(err);
    console.log('\n--- HEAD TO HEAD COMPARISON ---');
    console.log(JSON.stringify(rows, null, 2));
});
