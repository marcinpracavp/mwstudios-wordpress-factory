const fs = require('fs');
const path = require('path');
const prior = path.resolve(__dirname, '../078-audit-round-0/create-audit-sheets.js');
eval(fs.readFileSync(prior, 'utf8').replaceAll('comparison-1789318767631', 'comparison-1789346670154'));
