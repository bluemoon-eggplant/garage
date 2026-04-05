import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'output');

let fixed = 0;
let skipped = 0;

for (const category of fs.readdirSync(outputDir)) {
  const catDir = path.join(outputDir, category);
  if (!fs.statSync(catDir).isDirectory()) continue;

  for (const file of fs.readdirSync(catDir).filter(f => f.endsWith('.json'))) {
    const filePath = path.join(catDir, file);
    const record = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const data = record.data;

    if (!data || !data.tasks || data.tasks.length === 0) continue;
    if (data.shop === 'DIY') { skipped++; continue; }

    // Move tasks back to items as amount:null entries
    const items = data.items || [];
    for (const task of data.tasks) {
      items.push({ description: task, amount: null });
    }
    data.items = items;
    delete data.tasks;

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n', 'utf-8');
    console.log(`FIXED: ${category}/${file} (${data.tasks ? 0 : 0} tasks moved back)`);
    fixed++;
  }
}

console.log(`\nDone: ${fixed} files fixed, ${skipped} DIY records skipped`);
