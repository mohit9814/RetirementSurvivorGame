
import fs from 'fs';
import path from 'path';
import https from 'https';

// --- CONFIG ---
// Funds to check (Survivor Portfolio) - Corrected Codes
const TARGET_FUNDS = [
    { name: "Canara Robeco Large & Mid Cap Fund", matchKey: "118278", localCAGR: 20.0 },
    { name: "HDFC Mid Cap Opportunities", matchKey: "118989", localCAGR: 24.5 },
    { name: "SBI Small Cap Fund", matchKey: "125497", localCAGR: 26.0 },
    { name: "Parag Parikh Conservative Hybrid", matchKey: "148958", localCAGR: 12.0 },
    { name: "Nippon India Arbitrage", matchKey: "118585", localCAGR: 6.5 }
];

const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const REPORT_PATH = path.join(process.cwd(), 'src/data/anomaly_report.md');

// --- UTILS ---
function fetchFundDetails(code) {
    return new Promise((resolve, reject) => {
        const url = `https://api.mfapi.in/mf/${code}`;
        console.log(`Fetching details for ${code}...`);
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function calculateCAGR(data, years) {
    if (!data || data.length === 0) return 0;

    // Sort by date desc (API returns desc usually)
    // Format: DD-MM-YYYY
    const parsed = data.map(d => {
        const [dd, mm, yyyy] = d.date.split('-').map(Number);
        return { date: new Date(yyyy, mm - 1, dd), nav: parseFloat(d.nav) };
    }).sort((a, b) => b.date - a.date);

    const current = parsed[0];
    const targetDate = new Date(current.date);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    // Find closet nav to targetDate
    const start = parsed.find(d => d.date <= targetDate);

    if (!start) return 0;

    const absReturn = (current.nav - start.nav) / start.nav;
    const cagr = (Math.pow(1 + absReturn, 1 / years) - 1) * 100;
    return cagr;
}

async function run() {
    const rawMaster = fs.readFileSync(MASTER_PATH, 'utf-8');
    const master = JSON.parse(rawMaster);

    console.log(`Searching in ${master.length} funds...`);
    let report = "# Data Anomaly Report: Live vs Local\n\n";
    report += "| Fund | Scheme Code | Live 5Y CAGR | Local Data | Status |\n";
    report += "|:---|:---:|:---:|:---:|:---|\n";

    for (const target of TARGET_FUNDS) {
        // Direct Match by Code
        const hit = master.find(f => f.schemeCode == target.matchKey);

        if (!hit) {
            console.warn(`Could not find ${target.matchKey}`);
            report += `| ${target.name} | NOT FOUND | - | - | ❌ CRITICAL |\n`;
            continue;
        }

        try {
            const details = await fetchFundDetails(hit.schemeCode);
            const liveCAGR = calculateCAGR(details.data, 5).toFixed(2);
            const diff = (liveCAGR - target.localCAGR).toFixed(2);

            console.log(`${target.name}: Live=${liveCAGR}%, Local=${target.localCAGR}%, Diff=${diff}%`);
            report += `| ${target.name} | ${hit.schemeCode} | **${liveCAGR}%** | ${target.localCAGR}% | ${Math.abs(diff) > 5 ? '⚠️ High Deviation' : '✅ Verified'} |\n`;

        } catch (e) {
            console.error(e);
            report += `| ${target.name} | ${hit.schemeCode} | ERROR | - | ⚠️ Fetch Failed |\n`;
        }
    }

    fs.writeFileSync(REPORT_PATH, report);
    console.log("Anomaly Report Generated.");
}

run();
