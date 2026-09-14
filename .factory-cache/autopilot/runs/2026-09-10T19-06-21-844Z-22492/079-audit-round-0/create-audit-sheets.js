const fs = require('fs');
const path = require('path');

const priorScript = path.resolve(__dirname, '../078-audit-round-0/create-audit-sheets.js');
const source = fs.readFileSync(priorScript, 'utf8').replaceAll('comparison-1789318767631', 'comparison-1789327201418');

eval(source);
