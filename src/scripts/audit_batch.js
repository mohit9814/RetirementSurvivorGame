
import fs from 'fs';
import path from 'path';
import https from 'https';

const CSV_PATH = path.join(process.cwd(), 'reference data', 'Funds-Master_Metrics.csv');
const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const OUTPUT_CSV = path.join(process.cwd(), 'reference data', 'Funds-Audit-100to600.csv');
const REPORT_PATH = path.join(process.cwd(), 'src/data/audit_100to600.md');

const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));

function fetchFundDetails(code) {
    return new Promise((resolve) => {
        const url = `https://api.mfapi.in/mf/${code}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function calculateCAGR(details, years) {
    if (!details || !details.data || details.data.length === 0) return null;
    const sorted = details.data.sort((a, b) => {
        const da = a.date.split('-').reverse().join('');
        const db = b.date.split('-').reverse().join('');
        return db.localeCompare(da);
    });
    const latestStr = sorted[0].date;
    const [dd, mm, yyyy] = latestStr.split('-').map(Number);
    const latestDate = new Date(yyyy, mm - 1, dd);
    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    const startRecord = sorted.find(d => {
        const [d1, m1, y1] = d.date.split('-').map(Number);
        return new Date(y1, m1 - 1, d1) <= targetDate;
    });

    if (!startRecord) return null;
    const endNav = parseFloat(sorted[0].nav);
    const startNav = parseFloat(startRecord.nav);
    return ((Math.pow(endNav / startNav, 1 / years) - 1) * 100);
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Reading CSV...");
    const lines = fs.readFileSync(CSV_PATH, 'utf-8').split('\n').filter(l => l.trim().length > 0);
    const header = lines[0].trim().split(',');

    // Indices
    const iName = header.findIndex(h => h.trim() === 'Fund Name');
    const i5Y = header.findIndex(h => h.trim() === 'CAGR_5Y');

    const funds = lines.slice(1).map(line => {
        const cols = line.split(',');
        return { line: line, name: cols[iName], cagr5y: (parseFloat(cols[i5Y]) || 0) * 100 };
    });
    funds.sort((a, b) => b.cagr5y - a.cagr5y);

    // Process 100 to 600
    const batch = funds.slice(100, 600);
    console.log(`Auditing 500 Funds (Rank 100-600)...`);

    const newCsvLines = [lines[0].trim() + ",Live_5Y,Deviation,Status"];

    for (const fund of batch) {
        let bestMatch = master.find(m => m.schemeName.toLowerCase() === fund.name.toLowerCase());
        if (!bestMatch) {
            const parts = fund.name.split('-');
            const mainName = parts[0].trim();
            const candidates = master.filter(m =>
                m.schemeName.toLowerCase().includes(mainName.toLowerCase()) &&
                m.schemeName.toLowerCase().includes("direct") &&
                m.schemeName.toLowerCase().includes("growth")
            );
            if (candidates.length > 0) bestMatch = candidates[0];
        }

        let liveVal = "N/A", dev = 0, status = "Not Found";
        if (bestMatch) {
            const val = calculateCAGR(await fetchFundDetails(bestMatch.schemeCode), 5);
            if (val !== null) {
                liveVal = val.toFixed(2);
                dev = (val - fund.cagr5y).toFixed(2);
                status = Math.abs(dev) > 2 ? "High Dev" : (Math.abs(dev) > 0.5 ? "Moderate" : "Verified");
                console.log(`[${status}] ${fund.name.substring(0, 25)} | Live: ${liveVal}%`);
            } else { status = "Insufficient History"; }
            await delay(50);
        }
        newCsvLines.push(`${fund.line},${liveVal},${dev},${status}`);
    }

    fs.writeFileSync(OUTPUT_CSV, newCsvLines.join('\n'));
    console.log("Batch Complete.");
}

run();
