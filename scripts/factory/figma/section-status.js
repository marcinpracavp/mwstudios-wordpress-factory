const fs = require('fs');
const {
  FACTORY_PATHS,
  getSnapshotPaths,
  parseSectionArgument,
  readJson,
  resolveSnapshotFile
} = require('./utils');

function getSectionStatus(sectionId) {
  const figmaConfig = readJson(FACTORY_PATHS.figmaConfig);
  const paths = getSnapshotPaths(figmaConfig);
  if (!fs.existsSync(paths.manifest)) {
    throw new Error('No Figma snapshot is prepared. Run npm run factory:figma:prepare first.');
  }
  const manifest = readJson(paths.manifest);
  const section = (manifest.sections || []).find((item) => item.id === sectionId);
  if (!section) {
    throw new Error(`Section "${sectionId}" is not present in the snapshot manifest.`);
  }
  const files = [section.snapshot, section.desktopReference, section.mobileReference]
    .filter(Boolean)
    .map((relativePath) => resolveSnapshotFile(paths.cacheRoot, relativePath));
  const complete = manifest.status === 'complete'
    && Boolean(section.desktopNodeId)
    && Boolean(section.mobileNodeId)
    && files.length === 3
    && files.every((filePath) => filePath && fs.existsSync(filePath));
  return { complete, paths, section };
}

function main() {
  try {
    const options = parseSectionArgument(process.argv.slice(2));
    if (options.help) {
      console.log('Usage: npm run factory:figma:section -- --id <section-id>');
      return;
    }
    const result = getSectionStatus(options.id);
    const { section } = result;
    console.log(`Section: ${section.name}`);
    console.log(`Snapshot: ${section.snapshot}`);
    console.log(`Desktop node: ${section.desktopNodeId || 'N/R'}`);
    console.log(`Mobile node: ${section.mobileNodeId || 'N/R'}`);
    console.log(`Desktop reference: ${section.desktopReference || 'N/R'}`);
    console.log(`Mobile reference: ${section.mobileReference || 'N/R'}`);
    console.log(`Status: ${result.complete ? 'COMPLETE' : 'PARTIAL'}`);
  } catch (error) {
    console.error(`Factory Figma section failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { getSectionStatus };
