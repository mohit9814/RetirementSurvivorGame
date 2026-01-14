
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../../reference data/Funds-Master_Metrics.csv');
const DB_PATH = path.join(__dirname, '../../funds.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // 1. Create Table
    db.run(`CREATE TABLE IF NOT EXISTS funds (
        fund_name TEXT,
        category TEXT,
        cagr_3y REAL,
        cagr_5y REAL,
        mean_return REAL,
        volatility REAL,
        sharpe REAL,
        sortino REAL,
        downside_dev REAL,
        max_drawdown REAL,
        positive_months REAL,
        fund_house TEXT
    )`);

    // 2. Clear old data
    db.run(`DELETE FROM funds`);

    const stmt = db.prepare(`INSERT INTO funds VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    // 3. Read CSV
    fs.createReadStream(CSV_PATH)
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', row => {
            // Extract Fund House from Name (First 2 words usually, or just first)
            // Example: "HDFC Balanced..." -> "HDFC"
            // "Aditya Birla Sun Life..." -> "Aditya Birla Sun Life"
            // Heuristic: Split by space. If first word is simple, take it. 
            // Better: List of known houses? 
            // Simple: First 2 words if > 3 chars?
            // Let's take the first word for now, usually "HDFC", "SBI", "ICICI", "Axis".
            // Exception: "Aditya Birla", "Mirae Asset".
            // Let's take first 2 words as generic Fund House.
            const nameParts = row['Fund Name'].split(' ');
            let house = nameParts[0];
            if (['Aditya', 'Mirae', 'WhiteOak', 'Edelweiss', 'Motilal'].includes(house)) {
                house += ' ' + nameParts[1];
            } else if (house === 'Tata' || house === 'SBI' || house === 'HDFC' || house === 'Axis' || house === 'Kotak' || house === 'Nippon') {
                // Keep single word
            }

            stmt.run(
                row['Fund Name'],
                row['Category'],
                parseFloat(row['CAGR_3Y']) || 0,
                parseFloat(row['CAGR_5Y']) || 0,
                parseFloat(row['Mean Annual Return']) || 0,
                parseFloat(row['Annual Volatility']) || 0,
                parseFloat(row['Sharpe Ratio']) || 0,
                parseFloat(row['Sortino Ratio']) || 0,
                parseFloat(row['Downside Deviation']) || 0,
                parseFloat(row['Max Drawdown']) || 0,
                parseFloat(row['Positive Month %']) || 0,
                house
            );
        })
        .on('end', rowCount => {
            console.log(`Parsed ${rowCount} rows`);
            stmt.finalize();
            db.close();
            console.log('Database Ready: funds.db');
        });
});
