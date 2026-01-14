
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../../reference data/Funds-Master_Metrics.csv');
const DB_PATH = path.join(__dirname, '../../funds_v2.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // 0. Drop old table to enforce schema update
    db.run(`DROP TABLE IF EXISTS funds`);

    // 1. Create Table with Rolling Metrics
    db.run(`CREATE TABLE funds (
        fund_name TEXT,
        category TEXT,
        fund_house TEXT,
        years REAL,
        
        mean_return REAL,
        volatility REAL,
        max_drawdown REAL,
        sharpe REAL,
        sortino REAL,
        positive_months REAL,

        rolling_1y_mean REAL,
        rolling_2y_mean REAL,
        rolling_3y_mean REAL,
        rolling_5y_mean REAL,
        
        rolling_1y_median REAL,
        rolling_3y_median REAL
    )`);

    // 2. Clear old data
    db.run(`DELETE FROM funds`);

    const stmt = db.prepare(`INSERT INTO funds VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    // 3. Read CSV
    fs.createReadStream(CSV_PATH)
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', row => {
            // Extract Fund House
            const nameParts = row['Fund Name'].split(' ');
            let house = nameParts[0];
            if (['Aditya', 'Mirae', 'WhiteOak', 'Edelweiss', 'Motilal', 'Parag'].includes(house)) {
                house += ' ' + nameParts[1];
            } else if (house === 'Tata' || house === 'SBI' || house === 'HDFC' || house === 'Axis' || house === 'Kotak' || house === 'Nippon' || house === 'ICICI') {
                // Keep single word
            }

            stmt.run(
                row['Fund Name'],
                row['Category'],
                house,
                parseFloat(row['Years']) || 0,

                parseFloat(row['Mean Annual Return']) || 0,
                parseFloat(row['Annual Volatility']) || 0,
                parseFloat(row['Max Drawdown']) || 0,
                parseFloat(row['Sharpe Ratio']) || 0,
                parseFloat(row['Sortino Ratio']) || 0,
                parseFloat(row['Positive Month %']) || 0,

                parseFloat(row['Rolling 1y Mean']) || 0,
                parseFloat(row['Rolling 2y Mean']) || 0,
                parseFloat(row['Rolling 3y Mean']) || 0,
                parseFloat(row['Rolling 5y Mean']) || 0,

                parseFloat(row['Rolling 1y Median']) || 0,
                parseFloat(row['Rolling 3y Median']) || 0
            );
        })
        .on('end', rowCount => {
            console.log(`Parsed ${rowCount} rows into funds_v2.db`);
            stmt.finalize();
            db.close();
        });
});
