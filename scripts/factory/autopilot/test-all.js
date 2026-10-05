const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const directory = __dirname;
const tests = fs.readdirSync(directory)
  .filter(name => name.endsWith('.test.js'))
  .sort()
  .map(name => path.join(directory, name));

if (!tests.length) throw new Error('NO_AUTOPILOT_TESTS_FOUND');
const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: path.resolve(directory, '../../..'),
  env: process.env,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
