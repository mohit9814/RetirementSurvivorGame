
import fs from 'fs';
import path from 'path';
import https from 'https';

const OUTPUT_PATH = path.join(process.cwd(), 'src/data/mfapi_master.json');
const URL = 'https://api.mfapi.in/mf';

console.log(`Fetching master list from ${URL}...`);

https.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync(OUTPUT_PATH, data);
        console.log(`Saved ${JSON.parse(data).length} funds to ${OUTPUT_PATH}`);
    });
}).on('error', (err) => {
    console.error("Error fetching data:", err);
});
