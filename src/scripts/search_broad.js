
import fs from 'fs';
import path from 'path';

const MASTER_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'));

const QUERIES = [
    ["Canara", "Growth"],
    ["Canara", "Mid"],
    ["HDFC", "Mid", "Opp"],
    ["HDFC", "Mid", "Cap"]
];

console.log("--- BROAD SEARCH ---");

QUERIES.forEach(terms => {
    console.log(`\nResults for [${terms.join(', ')}]:`);
    const hits = master.filter(f => {
        const name = f.schemeName.toLowerCase();
        return terms.every(t => name.includes(t.toLowerCase()));
    });
    // Show top 20
    hits.slice(0, 20).forEach(h => console.log(`${h.schemeCode}: ${h.schemeName}`));
});
