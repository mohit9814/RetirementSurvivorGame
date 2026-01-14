
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../../reference data/Funds-Master_Metrics.csv');

const B2_CATEGORIES = [
    'Hybrid - Arbitrage',
    'Hybrid - Conservative',
    'Hybrid - Balanced Advantage',
    'Hybrid - Equity Savings'
];

const B3_CATEGORIES = [
    'Hybrid - Aggressive',
    'Hybrid - Equity Savings'
];

function parseCSV(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    const headers = lines[0].split(',');

    // Find indices
    const idxCategory = headers.indexOf('Category');
    const idxReturn = headers.indexOf('Mean Annual Return'); // Or CAGR? User said "Mean Annual Return" is in file
    const idxVol = headers.indexOf('Annual Volatility');

    console.log(`Indices: Cat=${idxCategory}, Ret=${idxReturn}, Vol=${idxVol}`);

    const buckets = {
        B2: { returns: [], vols: [] },
        B3: { returns: [], vols: [] }
    };

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Handle commas in quotes proper parsing is hard, usually split works if simple. 
        // Funds file usually has simple commas. Let's try simple split first.
        // If "Fund Name" has commas, index will shift.
        // Better: use a regex for split respecting quotes.
        const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // regex split often tricky.
        // Let's assume standard CSV structure or use simple split if no quotes in numbers.

        const cols = line.split(',');
        // If cols > expected, check if name has comma.
        // Actually, let's just search categories.

        // Find category by string match
        let category = null;
        let returnVal = null;
        let volVal = null;

        // Naive extraction: Scan for category name, then pick values at offset?
        // Risky. Let's try to find category index.
        // The CSV view showed "Category" is column 2 (index 2).
        // "Mean Annual Return" is col 12.
        // "Annual Volatility" is col 24.

        // If fund name contains comma, indices shift right.
        // Conservative strategy:
        // iterate categories. If row contains category string, assume it's valid.

        const rowStr = line;

        let foundCat = null;
        const allCats = [...B2_CATEGORIES, ...B3_CATEGORIES, 'Hybrid - Aggressive Hybrid']; // Check 'Hybrid - Aggressive' vs 'Hybrid - Aggressive Hybrid'

        for (const cat of allCats) {
            if (rowStr.includes(cat)) {
                foundCat = cat;
                break;
            }
        }

        if (foundCat) {
            // How to get numbers?
            // "Mean Annual Return" usually ~0.05 to 0.30.
            // "Annual Volatility" usually ~0.02 to 0.20.
            // They appear later in the line.

            // Re-read file content sample:
            // "...,0.1852...,...0.1649...,..."
            // It seems "Mean Annual Return" is around column 12.

            const parts = line.split(',');
            // If parts length is huge, maybe ok.
            // Let's assume Name is parts[0].
            // Category is parts[2].
            const rawCat = parts[2];

            // Check if parts[2] looks like a category
            let effectiveParts = parts;
            if (!allCats.includes(rawCat)) {
                // Formatting issue (commas in name).
                // Try to anchor from end?
                // ...
            }

            // Let's try to grab 'Mean Annual Return' by header index from row
            // If simple split works
            let r = parseFloat(parts[idxReturn]);
            let v = parseFloat(parts[idxVol]);

            if (isNaN(r) || isNaN(v)) {
                // Try to intelligent parse
                // Skip
                continue;
            }

            if (B2_CATEGORIES.some(c => line.includes(c))) {
                buckets.B2.returns.push(r);
                buckets.B2.vols.push(v);
            }
            // Note: Equity Savings is in BOTH
            if (B3_CATEGORIES.some(c => line.includes(c))) {
                buckets.B3.returns.push(r);
                buckets.B3.vols.push(v);
            }
        }
    }

    return buckets;
}

function getStats(arr) {
    if (arr.length === 0) return { mean: 0, median: 0 };
    const sorted = arr.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
        mean: sum / arr.length,
        median: sorted[Math.floor(arr.length / 2)],
        min: sorted[0],
        max: sorted[arr.length - 1]
    };
}

const res = parseCSV(CSV_PATH);

console.log('--- BUCKET 2 ANALYSIS (Income) ---');
const b2Ret = getStats(res.B2.returns);
const b2Vol = getStats(res.B2.vols);
console.log(`Count: ${res.B2.returns.length}`);
console.log(`Return: Mean ${(b2Ret.mean * 100).toFixed(2)}% | Median ${(b2Ret.median * 100).toFixed(2)}%`);
console.log(`Volatility: Mean ${(b2Vol.mean * 100).toFixed(2)}% | Median ${(b2Vol.median * 100).toFixed(2)}%`);

console.log('\n--- BUCKET 3 ANALYSIS (Growth) ---');
const b3Ret = getStats(res.B3.returns);
const b3Vol = getStats(res.B3.vols);
console.log(`Count: ${res.B3.returns.length}`);
console.log(`Return: Mean ${(b3Ret.mean * 100).toFixed(2)}% | Median ${(b3Ret.median * 100).toFixed(2)}%`);
console.log(`Volatility: Mean ${(b3Vol.mean * 100).toFixed(2)}% | Median ${(b3Vol.median * 100).toFixed(2)}%`);
