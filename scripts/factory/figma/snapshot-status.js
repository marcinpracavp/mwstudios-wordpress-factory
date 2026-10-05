const fs = require('fs');
const {
  FACTORY_PATHS,
  collectDeclaredReferences,
  getMissingSnapshotParts,
  getSnapshotPaths,
  readJson,
  resolveSnapshotFile
} = require('./utils');

function getSnapshotStatus({
  figmaConfig = readJson(FACTORY_PATHS.figmaConfig),
  paths = getSnapshotPaths(figmaConfig)
} = {}) {
  if (!fs.existsSync(paths.manifest)) {
    return { exists: false, paths };
  }

  const manifest = readJson(paths.manifest);
  const references = collectDeclaredReferences(manifest);
  const referenceCount = references.filter((reference) => {
    const referencePath = resolveSnapshotFile(paths.cacheRoot, reference.path);
    return referencePath && fs.existsSync(referencePath);
  }).length;
  return {
    exists: true,
    manifest,
    paths,
    referenceCount,
    referenceTotal: references.length,
    missing: getMissingSnapshotParts({ paths, manifest })
  };
}

function main() {
  try {
    const snapshot = getSnapshotStatus();
    console.log('Figma Snapshot');
    console.log('');
    if (!snapshot.exists) {
      console.log('Status: NOT PREPARED');
      console.log(`Cache: ${snapshot.paths.cacheRoot}`);
      console.log('Missing: manifest.json');
      return;
    }

    const { manifest } = snapshot;
    console.log(`Source: ${manifest.source && manifest.source.figmaUrl ? manifest.source.figmaUrl : 'N/R'}`);
    console.log(`File key: ${manifest.source && manifest.source.fileKey ? manifest.source.fileKey : 'N/R'}`);
    console.log(`Status: ${(manifest.status || 'partial').toUpperCase()}`);
    console.log(`Pages: ${Array.isArray(manifest.pages) ? manifest.pages.length : 0}`);
    console.log(`Sections: ${Array.isArray(manifest.sections) ? manifest.sections.length : 0}`);
    console.log(`References: ${snapshot.referenceCount}/${snapshot.referenceTotal}`);
    console.log(`Languages: ${Array.isArray(manifest.languages) && manifest.languages.length > 0 ? manifest.languages.join(', ') : 'N/R'}`);
    console.log(`Missing: ${snapshot.missing.length > 0 ? snapshot.missing.join(', ') : 'none'}`);
  } catch (error) {
    console.error(`Factory Figma status failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { getSnapshotStatus };
