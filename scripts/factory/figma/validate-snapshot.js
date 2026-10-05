const fs = require('fs');
const Ajv = require('ajv');
const {
  FACTORY_PATHS,
  collectDeclaredReferences,
  findDuplicates,
  getSnapshotPaths,
  readJson,
  resolveSnapshotFile
} = require('./utils');

function formatSchemaErrors(scope, errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || '/';
    const missing = error.params && error.params.missingProperty
      ? ` (${error.params.missingProperty})`
      : '';
    return `${scope} ${location}: ${error.message}${missing}`;
  });
}

function readRequiredJson(filePath, label, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${label} is missing`);
    return null;
  }
  try {
    return readJson(filePath);
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

function validateSnapshot({
  allowPartial = false,
  project: providedProject,
  figmaConfig: providedFigmaConfig,
  paths: providedPaths
} = {}) {
  const errors = [];
  const project = providedProject || readRequiredJson(FACTORY_PATHS.project, 'factory/project.json', errors);
  const figmaConfig = providedFigmaConfig
    || readRequiredJson(FACTORY_PATHS.figmaConfig, 'factory/figma.json', errors);
  if (!project || !figmaConfig) {
    return { errors, manifest: null, paths: null };
  }

  const paths = providedPaths || getSnapshotPaths(figmaConfig);
  const manifest = readRequiredJson(paths.manifest, 'manifest.json', errors);
  if (!manifest) {
    return { errors, manifest: null, paths };
  }

  const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
  const validateManifestSchema = ajv.compile(readJson(FACTORY_PATHS.manifestSchema));
  const validateSectionSchema = ajv.compile(readJson(FACTORY_PATHS.sectionSchema));
  if (!validateManifestSchema(manifest)) {
    errors.push(...formatSchemaErrors('manifest', validateManifestSchema.errors));
  }

  if (manifest.status !== 'complete' && !(allowPartial && manifest.status === 'partial')) {
    errors.push(`manifest status must be "complete" for validation (current: "${manifest.status || 'missing'}")`);
  }

  const expectedLanguages = Array.isArray(project.wordpress && project.wordpress.languages)
    ? project.wordpress.languages
    : [];
  const manifestLanguages = Array.isArray(manifest.languages) ? manifest.languages : [];
  const missingLanguages = expectedLanguages.filter((language) => !manifestLanguages.includes(language));
  const unexpectedLanguages = manifestLanguages.filter((language) => !expectedLanguages.includes(language));
  if (missingLanguages.length > 0 || unexpectedLanguages.length > 0) {
    errors.push(`manifest languages must match project languages (missing: ${missingLanguages.join(', ') || 'none'}; unexpected: ${unexpectedLanguages.join(', ') || 'none'})`);
  }

  if (!manifest.source || !manifest.source.fileKey) {
    errors.push('manifest source fileKey is missing');
  }
  if (!manifest.source || !manifest.source.figmaUrl) {
    errors.push('manifest source figmaUrl is missing');
  }

  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  const pageIds = pages.map((page) => page.id).filter(Boolean);
  findDuplicates(pageIds).forEach((id) => errors.push(`duplicate page id "${id}"`));
  const pageIdSet = new Set(pageIds);
  const pagesFile = readRequiredJson(paths.pages, 'pages.json', errors);
  if (pagesFile && JSON.stringify(pagesFile) !== JSON.stringify(pages)) {
    errors.push('pages.json must match the concise page inventory in manifest.json');
  }

  const frames = Array.isArray(manifest.frames) ? manifest.frames : [];
  const frameNodeIds = frames.map((frame) => frame.nodeId).filter(Boolean);
  findDuplicates(frameNodeIds).forEach((id) => errors.push(`duplicate frame node id "${id}"`));
  const frameNodeIdSet = new Set(frameNodeIds);
  frames.forEach((frame) => {
    if (frame.pageId && !pageIdSet.has(frame.pageId)) {
      errors.push(`frame "${frame.nodeId}" references unknown page id "${frame.pageId}"`);
    }
  });

  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];
  const sectionIds = sections.map((section) => section.id).filter(Boolean);
  const sectionOrders = sections.map((section) => section.order).filter(Number.isInteger);
  findDuplicates(sectionIds).forEach((id) => errors.push(`duplicate section id "${id}"`));
  findDuplicates(sectionOrders).forEach((order) => errors.push(`duplicate section order "${order}"`));
  sectionOrders.forEach((order) => {
    if (order < 1) {
      errors.push(`section order "${order}" must be positive`);
    }
  });
  const sortedOrders = [...sectionOrders].sort((left, right) => left - right);
  sortedOrders.forEach((order, index) => {
    if (order !== index + 1) {
      errors.push('section orders must be a continuous sequence starting at 1');
    }
  });
  const sectionIdSet = new Set(sectionIds);

  sections.forEach((section) => {
    if (!pageIdSet.has(section.pageId)) {
      errors.push(`section "${section.id}" references unknown page id "${section.pageId}"`);
    }
    ['desktopNodeId', 'mobileNodeId'].forEach((key) => {
      if (!section[key] && key === 'desktopNodeId') {
        errors.push(`section "${section.id}" is missing ${key}`);
      } else if (section[key] && !frameNodeIdSet.has(section[key])) {
        errors.push(`section "${section.id}" ${key} "${section[key]}" is not present in manifest frames`);
      }
    });
    ['desktopReference', 'mobileReference'].forEach((key) => {
      if (!section[key] && (key === 'desktopReference' || section.mobileNodeId)) {
        errors.push(`section "${section.id}" is missing ${key}`);
      }
    });
    if (Boolean(section.mobileNodeId) !== Boolean(section.mobileReference)) {
      errors.push(`section "${section.id}" mobile node and reference must be declared together`);
    }
    Object.entries(section.variants || {}).forEach(([language, variant]) => {
      if (!expectedLanguages.includes(language)) {
        errors.push(`section "${section.id}" uses language variant "${language}" outside project languages`);
      }
      ['desktopNodeId', 'mobileNodeId'].forEach((key) => {
        if (variant[key] && !frameNodeIdSet.has(variant[key])) {
          errors.push(`section "${section.id}" ${language} ${key} "${variant[key]}" is not present in manifest frames`);
        }
      });
    });

    const sectionPath = resolveSnapshotFile(paths.cacheRoot, section.snapshot);
    const sectionSnapshot = sectionPath
      ? readRequiredJson(sectionPath, `section snapshot "${section.id}"`, errors)
      : null;
    if (!sectionPath) {
      errors.push(`section "${section.id}" has an unsafe snapshot path`);
    }
    if (!sectionSnapshot) {
      return;
    }
    if (!validateSectionSchema(sectionSnapshot)) {
      errors.push(...formatSchemaErrors(`section snapshot "${section.id}"`, validateSectionSchema.errors));
    }
    if (sectionSnapshot.id !== section.id) {
      errors.push(`section snapshot "${section.id}" has mismatched id "${sectionSnapshot.id}"`);
    }
    if (sectionSnapshot.order !== section.order) {
      errors.push(`section snapshot "${section.id}" has mismatched order`);
    }
    if (!sectionSnapshot.source || sectionSnapshot.source.pageId !== section.pageId) {
      errors.push(`section snapshot "${section.id}" has mismatched pageId`);
    }
    ['desktopNodeId', 'mobileNodeId'].forEach((key) => {
      if (!sectionSnapshot.source || sectionSnapshot.source[key] !== section[key]) {
        errors.push(`section snapshot "${section.id}" has mismatched ${key}`);
      }
    });
  });

  (manifest.globalEffects || []).forEach((effect) => {
    if (effect.nodeId && !frameNodeIdSet.has(effect.nodeId)) {
      errors.push(`global effect "${effect.id}" nodeId "${effect.nodeId}" is not present in manifest frames`);
    }
    (effect.affects || []).forEach((sectionId) => {
      if (!sectionIdSet.has(sectionId)) {
        errors.push(`global effect "${effect.id}" affects unknown section "${sectionId}"`);
      }
    });
  });

  ['design-system.json', 'components.json', 'content-map.json'].forEach((fileName) => {
    const filePath = paths[fileName === 'design-system.json'
      ? 'designSystem'
      : fileName === 'components.json'
        ? 'components'
        : 'contentMap'];
    readRequiredJson(filePath, fileName, errors);
  });

  collectDeclaredReferences(manifest).forEach((reference) => {
    const referencePath = resolveSnapshotFile(paths.cacheRoot, reference.path);
    if (!referencePath) {
      errors.push(`${reference.owner} has an unsafe reference path`);
    } else if (!fs.existsSync(referencePath)) {
      errors.push(`${reference.owner} is missing file "${reference.path}"`);
    }
  });

  return { errors, manifest, paths };
}

function main() {
  try {
    const result = validateSnapshot();
    console.log('Figma snapshot validation');
    console.log('');
    if (result.errors.length === 0) {
      console.log('FIGMA SNAPSHOT VALID');
      return;
    }
    result.errors.forEach((error) => console.log(`- ${error}`));
    console.log('');
    console.log('FIGMA SNAPSHOT INVALID');
    process.exitCode = 1;
  } catch (error) {
    console.log('Figma snapshot validation');
    console.log('');
    console.log(`- ${error.message}`);
    console.log('');
    console.log('FIGMA SNAPSHOT INVALID');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateSnapshot };
