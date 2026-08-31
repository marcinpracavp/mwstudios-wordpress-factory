const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const FACTORY_PATHS = {
  project: path.join(ROOT_DIR, 'factory', 'project.json'),
  figmaConfig: path.join(ROOT_DIR, 'factory', 'figma.json'),
  manifestSchema: path.join(ROOT_DIR, 'factory', 'schemas', 'figma-snapshot.schema.json'),
  sectionSchema: path.join(ROOT_DIR, 'factory', 'schemas', 'figma-section.schema.json')
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getCacheRoot(figmaConfig = readJson(FACTORY_PATHS.figmaConfig)) {
  const cacheRoot = path.resolve(ROOT_DIR, figmaConfig.cacheRoot);
  const expectedRoot = path.resolve(ROOT_DIR, '.factory-cache', 'figma', 'latest');

  if (cacheRoot !== expectedRoot) {
    throw new Error('Figma snapshot cacheRoot must resolve to .factory-cache/figma/latest.');
  }

  return cacheRoot;
}

function getSnapshotPaths(figmaConfig) {
  const cacheRoot = getCacheRoot(figmaConfig);
  return {
    cacheRoot,
    manifest: path.join(cacheRoot, 'manifest.json'),
    pages: path.join(cacheRoot, 'pages.json'),
    designSystem: path.join(cacheRoot, 'design-system.json'),
    components: path.join(cacheRoot, 'components.json'),
    contentMap: path.join(cacheRoot, 'content-map.json'),
    sections: path.join(cacheRoot, 'sections'),
    references: path.join(cacheRoot, 'references'),
    fullReferences: path.join(cacheRoot, 'references', 'full'),
    sectionReferences: path.join(cacheRoot, 'references', 'sections'),
    assetReferences: path.join(cacheRoot, 'assets', 'references')
  };
}

function ensureSnapshotDirectories(paths) {
  [
    paths.cacheRoot,
    paths.sections,
    paths.references,
    paths.fullReferences,
    paths.sectionReferences,
    paths.assetReferences
  ].forEach((directoryPath) => fs.mkdirSync(directoryPath, { recursive: true }));
}

function parseForceArgument(argv) {
  if (argv.length === 0) {
    return false;
  }
  if (argv.length === 1 && argv[0] === '--force') {
    return true;
  }
  throw new Error('Usage: npm run factory:figma:prepare [-- --force]');
}

function parseSectionArgument(argv) {
  if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) {
    return { help: true };
  }
  if (argv.length !== 2 || argv[0] !== '--id' || !argv[1]) {
    throw new Error('Usage: npm run factory:figma:section -- --id <section-id>');
  }
  return { id: argv[1] };
}

function extractFigmaFileKey(figmaUrl) {
  if (typeof figmaUrl !== 'string' || figmaUrl.trim() === '') {
    throw new Error('Factory Figma snapshot requires figma.url.');
  }

  let url;
  try {
    url = new URL(figmaUrl);
  } catch (error) {
    throw new Error('Factory Figma snapshot requires a valid figma.url.');
  }

  if (url.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(url.hostname)) {
    throw new Error('Factory Figma snapshot requires an HTTPS figma.com URL.');
  }

  const match = url.pathname.match(/^\/(?:file|design)\/([A-Za-z0-9]+)(?:\/|$)/);
  if (!match) {
    throw new Error('Factory Figma snapshot could not extract a file key from figma.url.');
  }

  return match[1];
}

function isPathInside(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function resolveSnapshotFile(cacheRoot, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    return null;
  }
  const resolvedPath = path.resolve(cacheRoot, relativePath);
  return isPathInside(cacheRoot, resolvedPath) ? resolvedPath : null;
}

function collectDeclaredReferences(manifest) {
  const references = [];
  const fullReferences = manifest.references && manifest.references.full
    ? manifest.references.full
    : {};

  Object.entries(fullReferences).forEach(([id, referencePath]) => {
    references.push({ owner: `full reference "${id}"`, path: referencePath });
  });

  (manifest.sections || []).forEach((section) => {
    if (section.desktopReference) {
      references.push({ owner: `section "${section.id}" desktop`, path: section.desktopReference });
    }
    if (section.mobileReference) {
      references.push({ owner: `section "${section.id}" mobile`, path: section.mobileReference });
    }
    Object.entries(section.variants || {}).forEach(([language, variant]) => {
      references.push({ owner: `section "${section.id}" ${language} desktop`, path: variant.desktopReference });
      references.push({ owner: `section "${section.id}" ${language} mobile`, path: variant.mobileReference });
    });
  });

  return references;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });
  return [...duplicates];
}

function getMissingSnapshotParts({ paths, manifest }) {
  const missing = [];
  [
    ['pages.json', paths.pages],
    ['design-system.json', paths.designSystem],
    ['components.json', paths.components],
    ['content-map.json', paths.contentMap]
  ].forEach(([label, filePath]) => {
    if (!fs.existsSync(filePath)) {
      missing.push(label);
    }
  });

  (manifest.sections || []).forEach((section) => {
    const snapshotPath = resolveSnapshotFile(paths.cacheRoot, section.snapshot);
    if (!snapshotPath || !fs.existsSync(snapshotPath)) {
      missing.push(`section snapshot: ${section.id}`);
    }
  });

  collectDeclaredReferences(manifest).forEach((reference) => {
    const referencePath = resolveSnapshotFile(paths.cacheRoot, reference.path);
    if (!referencePath || !fs.existsSync(referencePath)) {
      missing.push(`reference: ${reference.path}`);
    }
  });

  return missing;
}

module.exports = {
  FACTORY_PATHS,
  ROOT_DIR,
  collectDeclaredReferences,
  ensureSnapshotDirectories,
  extractFigmaFileKey,
  findDuplicates,
  getCacheRoot,
  getMissingSnapshotParts,
  getSnapshotPaths,
  isPathInside,
  parseForceArgument,
  parseSectionArgument,
  readJson,
  resolveSnapshotFile,
  writeJson
};
