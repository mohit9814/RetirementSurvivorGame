
import fs from 'fs';
import path from 'path';
import https from 'https';

const CSV_PATH = path.join(process.cwd(), 'reference data', 'Funds-Master_Metrics.csv');
const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const OUTPUT_CSV = path.join(process.cwd(), 'reference data', 'Funds-Master_Metrics_Audited.csv');
const REPORT_PATH = path.join(process.cwd(), 'data_audit_full.md');

// Load MFAPI Master
const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));

// Helper to fetch live data
function fetchFundDetails(code) {
    return new Promise((resolve) => {
        const url = `https://api.mfapi.in/mf/${code}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function calculateCAGR(details, years) {
    if (!details || !details.data || details.data.length === 0) return null;

    // Sort desc
    const parsed = details.data.map(d => {
        const [dd, mm, yyyy] = d.date.split('-').map(Number);
        return { date: new Date(yyyy, mm - 1, dd), nav: parseFloat(d.nav) };
    }).sort((a, b) => b.date - a.date);

    const current = parsed[0];
    const targetDate = new Date(current.date);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    // Find closet nav to targetDate
    const start = parsed.find(d => d.date <= targetDate);

    if (!start) return null; // Not enough history

    const absReturn = (current.nav - start.nav) / start.nav;
    const cagr = (Math.pow(1 + absReturn, 1 / years) - 1) * 100;
    return cagr;
}

async function run() {
    console.log("Starting Full CSV Audit...");
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n');
    const header = lines[0].trim().split(',');

    // Add new columns
    const newHeader = [...header, "Live_5Y_CAGR", "Deviation_Percent", "Status"].join(',');
    const newLines = [newHeader];

    let discrepancies = "| Fund Name | CSV 5Y Return | Live 5Y CAGR | Deviation | Status |\n|---|---|---|---|---|\n";
    let checkedCount = 0;
    let anomalyCount = 0;

    // Process first 50 lines for now to test, or process relevant ones
    // User asked for ALL. We will limit concurrency.

    // Map CSV Index
    const idxName = header.findIndex(h => h.includes("Scheme Name"));
    const idx5Y = header.findIndex(h => h.includes("5Y_Returns")); // Assuming column name, need to verify

    console.log(`Header columns: ${header.join(', ')}`);

    // Iterate (limit to 20 for safety in this tool call, we can scale up)
    for (let i = 1; i < lines.length && i < 50; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parse (handling quotes roughly)
        const cols = line.split(',');
        // Note: This split is fragile if names contain commas.
        // Better to use a proper parser but for now we assume standard format.

        const name = cols[idxName]; // Adjust index if needed
        // Assuming user provided CSV has standard columns.

        // Find in Master
        // Try to match name
        const hit = master.find(f => f.schemeName.toLowerCase() === name.toLowerCase()) ||
            master.find(f => f.schemeName.toLowerCase().includes(name.toLowerCase()) && f.schemeName.includes("Direct") && f.schemeName.includes("Growth"));

        let status = "Not Found";
        let liveVal = "";
        let dev = "";

        if (hit) {
            const details = await fetchFundDetails(hit.schemeCode);
            const liveCAGR = calculateCAGR(details, 5);

            if (liveCAGR !== null) {
                const csvVal = parseFloat(cols[cols.length - 2]); // Guessing column for now
                // We need to know which column is 5Y return.
                // Since we can't see the file, I'll log the header first and stop.
            }
        }
    }
}

// Just log header for now to ensure I check the right column
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvContent.split('\n');
console.log("CSV Columns:", lines[0]);
