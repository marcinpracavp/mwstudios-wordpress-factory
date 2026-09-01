const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { ROOT_DIR } = require('./utils');

const SOURCE_DIRECTORIES = [
  'src',
  'assets',
  'acf-json',
  'functions',
  'partials',
  'templates',
  'woocommerce'
];
const SOURCE_FILES = [
  'style.css',
  'functions.php',
  'header.php',
  'footer.php',
  'front-page.php',
  'index.php',
  'factory/project.json',
  'factory/qa.json',
  '.factory-cache/figma/latest/manifest.json',
  '.factory-cache/figma/latest/site-map.json',
  '.factory-cache/figma/latest/design-system.json',
  '.factory-cache/figma/latest/components.json',
  '.factory-cache/figma/latest/content-map.json'
];

function listFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }
  const stats = fs.statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }
  return fs.readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(targetPath, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function hashPaths(paths) {
  const hash = crypto.createHash('sha256');
  paths.slice().sort().forEach((filePath) => {
    hash.update(path.relative(ROOT_DIR, filePath).split(path.sep).join('/'));
    hash.update('\0');
    hash.update(fs.readFileSync(filePath));
    hash.update('\0');
  });
  return hash.digest('hex');
}

function sourceFiles() {
  const explicit = SOURCE_FILES.map((relativePath) => path.join(ROOT_DIR, relativePath));
  const rootTemplates = fs.readdirSync(ROOT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.php'))
    .map((entry) => path.join(ROOT_DIR, entry.name));
  return [...new Set([
    ...explicit.flatMap(listFiles),
    ...SOURCE_DIRECTORIES.flatMap((directory) => listFiles(path.join(ROOT_DIR, directory))),
    ...rootTemplates
  ])];
}

function evidenceFingerprints() {
  const distFiles = listFiles(path.join(ROOT_DIR, 'dist'));
  return {
    sourceFingerprint: hashPaths(sourceFiles()),
    buildFingerprint: distFiles.length > 0 ? hashPaths(distFiles) : null
  };
}

function matrixFingerprint({ routes, languages, viewports }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    routes,
    languages,
    viewports
  })).digest('hex');
}

module.exports = {
  evidenceFingerprints,
  hashPaths,
  matrixFingerprint,
  sourceFiles
};
