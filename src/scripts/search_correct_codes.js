
import fs from 'fs';
import path from 'path';

const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const raw = fs.readFileSync(MASTER_PATH, 'utf-8');
const master = JSON.parse(raw);

const QUERIES = [
    "Canara Robeco Large & Mid Cap Fund",
    "HDFC Mid-Cap Opportunities",
    "SBI Small Cap Fund",
    "Parag Parikh Conservative",
    "Nippon India Arbitrage"
];

console.log("--- FINDING DIRECT GROWTH PLANS ---");

QUERIES.forEach(q => {
    // We want "Direct" AND "Growth" in the name usually
    const hits = master.filter(f => {
        const name = f.schemeName.toLowerCase();
        return name.includes(q.toLowerCase()) &&
            name.includes("direct") &&
            name.includes("growth");
    });

    if (hits.length > 0) {
        console.log(`\nMatch for "${q}":`);
        hits.forEach(h => console.log(`  ${h.schemeCode}: ${h.schemeName}`));
    } else {
        console.log(`\nNo Direct Growth match for "${q}". Top general matches:`);
        const generalHits = master.filter(f => f.schemeName.toLowerCase().includes(q.toLowerCase()));
        generalHits.slice(0, 3).forEach(h => console.log(`  ${h.schemeCode}: ${h.schemeName}`));
    }
});
