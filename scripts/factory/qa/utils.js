const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

function resetDirectory(directoryPath) {
  fs.rmSync(directoryPath, { recursive: true, force: true });
  return ensureDirectory(directoryPath);
}

function safeFileName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function joinUrl(baseUrl, ...paths) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, '');
  const segments = paths
    .map((value) => String(value || '').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);

  url.pathname = [basePath, ...segments].filter(Boolean).join('/') || '/';
  return url.toString();
}

function relativePath(fromPath, targetPath) {
  return path.relative(fromPath, targetPath).split(path.sep).join('/');
}

function parseCliArguments(argv) {
  const options = {};
  const supported = new Set(['route', 'viewport', 'lang', 'section']);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (!argument.startsWith('--')) {
      throw new Error(`Unknown argument "${argument}".`);
    }

    const key = argument.slice(2);
    if (!supported.has(key)) {
      throw new Error(`Unknown option "${argument}".`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Option "${argument}" requires a value.`);
    }
    options[key] = value;
    index += 1;
  }

  return options;
}

function printUsage() {
  console.log('Usage: npm run factory:qa -- [--route <id>] [--viewport <id>] [--lang <code>] [--section <id>]');
}

module.exports = {
  ROOT_DIR,
  ensureDirectory,
  joinUrl,
  parseCliArguments,
  printUsage,
  readJson,
  relativePath,
  resetDirectory,
  safeFileName,
  writeJson
};
