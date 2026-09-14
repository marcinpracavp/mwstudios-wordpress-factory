const fs = require('fs');
const path = require('path');

const priorScript = path.resolve(__dirname, '../079-audit-round-0/run-interaction-audit.js');
eval(fs.readFileSync(priorScript, 'utf8'));
