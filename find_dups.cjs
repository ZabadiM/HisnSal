const fs = require('fs');
const content = fs.readFileSync('src/data/hisnMuslim.ts', 'utf8');
const matches = [...content.matchAll(/id: '([^']+)',\s+title: '([^']+)'/g)];
const titles = matches.map(m => m[2]);
const duplicates = titles.filter((item, index) => titles.indexOf(item) !== index);
duplicates.forEach(dup => {
  console.log(dup, matches.filter(m => m[2] === dup).map(m => m[1]));
});
if (duplicates.length === 0) console.log('No duplicates found.');
