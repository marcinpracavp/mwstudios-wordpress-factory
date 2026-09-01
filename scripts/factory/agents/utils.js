const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

function writeJsonAtomic(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, filePath);
}

function appendJsonLine(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8');
}

function slashPath(value) {
  return String(value).split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  return slashPath(path.relative(ROOT_DIR, filePath));
}

function isInside(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function resolveInside(rootPath, relativePath) {
  const resolved = path.resolve(rootPath, relativePath);
  if (!isInside(rootPath, resolved)) {
    throw new Error(`Unsafe path outside Factory root: ${relativePath}`);
  }
  return resolved;
}

function hashFiles(filePaths) {
  const hash = crypto.createHash('sha256');
  filePaths.slice().sort().forEach((filePath) => {
    hash.update(relativeToRoot(filePath));
    hash.update('\0');
    hash.update(fs.readFileSync(filePath));
    hash.update('\0');
  });
  return hash.digest('hex');
}

function compactText(value, maxLength = 4000) {
  const text = String(value || '').trim();
  return text.length <= maxLength ? text : text.slice(-maxLength);
}

function createRunId(date = new Date()) {
  const timestamp = date.toISOString().replace(/[-:.]/g, '').replace('Z', 'Z');
  return `${timestamp}-${crypto.randomBytes(3).toString('hex')}`;
}

module.exports = {
  ROOT_DIR,
  appendJsonLine,
  compactText,
  createRunId,
  ensureDirectory,
  hashFiles,
  isInside,
  readJson,
  relativeToRoot,
  resolveInside,
  slashPath,
  writeJsonAtomic
};
