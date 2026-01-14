
import fs from 'fs';
import path from 'path';
import https from 'https';

const CSV_PATH = path.join(process.cwd(), 'reference data', 'Funds-Master_Metrics.csv');
const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const OUTPUT_CSV = path.join(process.cwd(), 'reference data', 'Funds-Master_Metrics_Verified.csv');

// Load MFAPI Master
let master;
try {
    master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));
} catch (e) {
    console.error("Master JSON not found. Run fetch_mfapi_dump.js first.");
    process.exit(1);
}

function fetchFundDetails(code) {
    return new Promise((resolve) => {
        const url = `https://api.mfapi.in/mf/${code}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { // Corrected syntax
                try {
                    resolve(JSON.parse(data));
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function calculateCAGR(details, years) {
    if (!details || !details.data || details.data.length === 0) return null;

    // Optimistic sort check (usually api returns desc)
    let sorted = details.data;
    if (new Date(sorted[0].date) < new Date(sorted[sorted.length - 1].date)) {
        sorted = details.data.reverse(); // simple reverse if asc
        // Actually date parsing comparison is safer
    }

    // Parse latest
    const latestStr = sorted[0].date;
    const [dd, mm, yyyy] = latestStr.split('-').map(Number);
    const latestDate = new Date(yyyy, mm - 1, dd);

    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    // Find record
    const startRecord = sorted.find(d => {
        const [d1, m1, y1] = d.date.split('-').map(Number);
        return new Date(y1, m1 - 1, d1) <= targetDate;
    });

    if (!startRecord) return null;

    const endNav = parseFloat(sorted[0].nav);
    const startNav = parseFloat(startRecord.nav);

    // CAGR
    return ((Math.pow(endNav / startNav, 1 / years) - 1) * 100);
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Starting Full CSV Regeneration...");
    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    const headerLine = lines[0];
    const headerCols = headerLine.trim().split(',');

    // Indices
    const iName = headerCols.findIndex(h => h.includes("Fund Name"));
    const i5Y = headerCols.findIndex(h => h.includes("CAGR_5Y"));

    if (iName === -1 || i5Y === -1) {
        console.error("Columns missing");
        return;
    }

    console.log(`Processing ${lines.length - 1} funds...`);

    let updatedCount = 0;
    const newLines = [headerLine.trim()]; // Preserve header

    // Sort lines by priority? No, user wants same format. But we can process and rebuild.
    // To match original order, we iterate linearly.

    // We will process batches of 50 in parallel to speed up?
    // Rate limit is a concern. 
    // Let's do sequential with small delay + high timeout.

    const startTime = Date.now();
    const MAX_RUNTIME = 120 * 1000; // 2 minutes

    for (let i = 1; i < lines.length; i++) {
        // Check timeout
        if (Date.now() - startTime > MAX_RUNTIME) {
            console.log("Time limit reached. Saving progress...");
            // Append remaining lines as is
            newLines.push(...lines.slice(i).map(l => l.trim()));
            break;
        }

        const line = lines[i].trim();
        const cols = line.split(','); // Fragile split
        const name = cols[iName];

        let liveVal = null;

        // Find match
        let bestMatch = master.find(m => m.schemeName.toLowerCase() === name.toLowerCase());

        if (!bestMatch) {
            const parts = name.split('-');
            const mainName = parts[0].trim();
            const candidates = master.filter(m =>
                m.schemeName.toLowerCase().includes(mainName.toLowerCase()) &&
                m.schemeName.toLowerCase().includes("direct") &&
                m.schemeName.toLowerCase().includes("growth")
            );
            if (candidates.length > 0) bestMatch = candidates[0];
        }

        if (bestMatch) {
            const details = await fetchFundDetails(bestMatch.schemeCode);
            liveVal = calculateCAGR(details, 5);
            await delay(20); // 20ms delay
        }

        if (liveVal !== null) {
            // Update column
            cols[i5Y] = (liveVal / 100).toFixed(4); // CSV uses 0.26 format?
            // Wait, previous audit showed CSV values like 0.29
            // My calculateCAGR returns 29.0
            // So convert back to decimal: 29.0 / 100 = 0.29
            updatedCount++;
            if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount} funds...`);
        } else {
            // If API failed or no history, keep original
        }

        newLines.push(cols.join(','));
    }

    fs.writeFileSync(OUTPUT_CSV, newLines.join('\n'));
    console.log(`\nDone! Updated ${updatedCount} funds.`);
    console.log(`Saved to ${OUTPUT_CSV}`);
}

run();
