
import fs from 'fs';
import path from 'path';
import https from 'https';

const CSV_PATH = path.join(process.cwd(), 'reference data', 'Funds-Master_Metrics.csv');
const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const OUTPUT_CSV = path.join(process.cwd(), 'reference data', 'Funds-Audit-Top100.csv');
const REPORT_PATH = path.join(process.cwd(), 'src/data/discrepancy_report.md');

// Load MFAPI Master
const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));

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

    // Sort desc (just in case)
    const sorted = details.data.sort((a, b) => {
        const da = a.date.split('-').reverse().join('');
        const db = b.date.split('-').reverse().join('');
        return db.localeCompare(da);
    });

    // Parse latest date
    const latestStr = sorted[0].date; // DD-MM-YYYY
    const [dd, mm, yyyy] = latestStr.split('-').map(Number);
    const latestDate = new Date(yyyy, mm - 1, dd);

    // Target date = Latest - 5 years
    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    // Find first record <= targetDate
    const startRecord = sorted.find(d => {
        const [d1, m1, y1] = d.date.split('-').map(Number);
        const dateObj = new Date(y1, m1 - 1, d1);
        return dateObj <= targetDate;
    });

    if (!startRecord) return null;

    const endNav = parseFloat(sorted[0].nav);
    const startNav = parseFloat(startRecord.nav);

    const absReturn = (endNav - startNav) / startNav;
    const cagr = (Math.pow(1 + absReturn, 1 / years) - 1) * 100;
    return cagr;
}

// Helper to delay
const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Reading CSV...");
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
    const header = lines[0].trim().split(',');

    // Indices
    const iName = header.findIndex(h => h.trim() === 'Fund Name');
    const i5Y = header.findIndex(h => h.trim() === 'CAGR_5Y');

    if (iName === -1 || i5Y === -1) {
        console.error("Columns not found");
        return;
    }

    // Parse Objects
    const funds = lines.slice(1).map(line => {
        const cols = line.split(','); // Simple split
        return {
            line: line,
            name: cols[iName],
            cagr5y: (parseFloat(cols[i5Y]) || 0) * 100 // Convert 0.26 -> 26.0
        };
    });

    // Sort by CAGR 5Y Descending
    funds.sort((a, b) => b.cagr5y - a.cagr5y);

    // Take top 100
    const topFunds = funds.slice(0, 100);

    console.log(`Auditing Top ${topFunds.length} Funds...`);

    let report = "# 🔍 Top 100 Funds Audit Report\n\n";
    report += "| Fund Name | Scheme Code | Assumed 5Y | Live 5Y | Deviation | Status |\n";
    report += "|---|---|---|---|---|---|\n";

    const newCsvLines = [lines[0].trim() + ",Live_5Y,Deviation,Status"];

    for (const fund of topFunds) {
        // IMPROVED SEARCH LOGIC
        // 1. Try Exact match
        let bestMatch = master.find(m => m.schemeName.toLowerCase() === fund.name.toLowerCase());

        // 2. Try identifying key parts
        if (!bestMatch) {
            // Split name by '-' to get the main fund name part (e.g. "SBI PSU Fund")
            const parts = fund.name.split('-');
            const mainName = parts[0].trim();

            // Search for main name + "Direct" + "Growth"
            const candidates = master.filter(m =>
                m.schemeName.toLowerCase().includes(mainName.toLowerCase()) &&
                m.schemeName.toLowerCase().includes("direct") &&
                m.schemeName.toLowerCase().includes("growth")
            );

            // If candidates found, pick the one with shortest name (least extra fluff) or just first
            if (candidates.length > 0) {
                bestMatch = candidates.sort((a, b) => a.schemeName.length - b.schemeName.length)[0];
            }
        }

        // 3. Fallback: try just main name + Growth (if Direct missing in name but maybe mostly Direct in list?)
        // actually avoid this to prevent matching Regular plans.

        let liveVal = "N/A";
        let dev = 0;
        let status = "Not Found";
        let code = "-";

        if (bestMatch) {
            code = bestMatch.schemeCode;
            const details = await fetchFundDetails(code);
            const val = calculateCAGR(details, 5);

            if (val !== null) {
                liveVal = val.toFixed(2);
                const diff = val - fund.cagr5y;
                dev = diff.toFixed(2);

                if (Math.abs(diff) > 2) status = "⚠️ High Deviation";
                else if (Math.abs(diff) > 0.5) status = "⚠️ Moderate";
                else status = "✅ Verifed";

                console.log(`[${status}] ${fund.name.substring(0, 30)}... | Local: ${fund.cagr5y.toFixed(2)}% | Live: ${liveVal}% | Diff: ${dev}%`);
            } else {
                status = "Insufficient History";
                console.log(`[Too New] ${fund.name}`);
            }
            await delay(50);
        } else {
            console.log(`[Not Found] ${fund.name}`);
        }

        report += `| ${fund.name} | ${code} | ${fund.cagr5y.toFixed(2)}% | ${liveVal}% | ${dev}% | ${status} |\n`;
        newCsvLines.push(`${fund.line},${liveVal},${dev},${status}`);
    }

    fs.writeFileSync(OUTPUT_CSV, newCsvLines.join('\n'));
    fs.writeFileSync(REPORT_PATH, report);
    console.log(`Audit Complete. Saved to ${OUTPUT_CSV} and ${REPORT_PATH}`);
}

run();
