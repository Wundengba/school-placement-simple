import fs from 'fs';

const rawData = fs.readFileSync('schools_raw.txt', 'utf-8');
const lines = rawData.trim().split('\n');

const schools = [];
const counters = { A: 0, B: 0, C: 0 };

lines.forEach(line => {
  const parts = line.split('\t').map(s => s.trim());
  if (parts.length === 3) {
    const [name, categoryStr, region] = parts;
    const category = categoryStr.split(' ')[1];
    
    if (category && ['A', 'B', 'C'].includes(category)) {
      counters[category]++;
      const id = `${category}${counters[category]}`;
      schools.push({ id, name, category, region });
    }
  }
});

const output = `const schools = [
${schools.map(s => `  { id: '${s.id}', name: "${s.name.replace(/"/g, '\\"')}", category: '${s.category}', region: '${s.region}' }`).join(',\n')}
]

export default schools
`;

fs.writeFileSync('schools.js', output);
console.log(`✓ Generated schools.js with ${schools.length} schools`);
console.log(`  Category A: ${counters.A}`);
console.log(`  Category B: ${counters.B}`);
console.log(`  Category C: ${counters.C}`);
