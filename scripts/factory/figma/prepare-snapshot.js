const fs = require('fs');
const {
  FACTORY_PATHS,
  ensureSnapshotDirectories,
  extractFigmaFileKey,
  getSnapshotPaths,
  parseForceArgument,
  readJson,
  writeJson
} = require('./utils');

function createPreparedManifest({ figmaConfig, figmaUrl, fileKey }) {
  return {
    snapshotVersion: figmaConfig.snapshotVersion,
    status: 'prepared',
    source: {
      fileKey,
      figmaUrl
    },
    capturedAt: new Date().toISOString(),
    pages: [],
    frames: [],
    sections: [],
    languages: [],
    viewports: [],
    globalEffects: [],
    warnings: [
      'Prepared by Factory. Populate this cache through Codex using Figma MCP; Node scripts do not read Figma.'
    ]
  };
}

function prepareSnapshot({
  force = false,
  project = readJson(FACTORY_PATHS.project),
  figmaConfig = readJson(FACTORY_PATHS.figmaConfig),
  paths = getSnapshotPaths(figmaConfig)
} = {}) {
  const fileKey = extractFigmaFileKey(project.figma && project.figma.url);

  if (fs.existsSync(paths.cacheRoot) && !force) {
    throw new Error('Snapshot already exists.\nUse:\nnpm run factory:figma:prepare -- --force');
  }

  if (fs.existsSync(paths.cacheRoot)) {
    fs.rmSync(paths.cacheRoot, { recursive: true, force: true });
  }

  ensureSnapshotDirectories(paths);
  writeJson(paths.manifest, createPreparedManifest({
    figmaConfig,
    figmaUrl: project.figma.url,
    fileKey
  }));
  writeJson(paths.pages, []);

  return { fileKey, paths, reset: force };
}

function main() {
  try {
    const force = parseForceArgument(process.argv.slice(2));
    const result = prepareSnapshot({ force });
    console.log('Figma snapshot prepared');
    console.log(`Source: ${result.fileKey}`);
    console.log(`Cache: ${result.paths.cacheRoot}`);
    if (result.reset) {
      console.log('Existing snapshot reset with --force.');
    }
    console.log('Next: complete discovery through Codex and Figma MCP, then run npm run factory:figma:validate.');
  } catch (error) {
    console.error(`Factory Figma prepare failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { createPreparedManifest, prepareSnapshot };
