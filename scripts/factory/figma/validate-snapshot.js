const fs = require('fs');
const Ajv = require('ajv');
const {
  FACTORY_PATHS,
  collectDeclaredReferences,
  collectSiteMapReferences,
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

function validateJsonArtifact({ ajv, value, schemaPath, label, errors }) {
  if (value === null) {
    return;
  }
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(value)) {
    errors.push(...formatSchemaErrors(label, validate.errors));
  }
}

function sameMembers(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function validateContinuousOrders(sections, errors) {
  const byPage = new Map();
  sections.forEach((section) => {
    if (!byPage.has(section.sitePageId)) {
      byPage.set(section.sitePageId, []);
    }
    byPage.get(section.sitePageId).push(section.order);
  });
  byPage.forEach((orders, sitePageId) => {
    findDuplicates(orders).forEach((order) => {
      errors.push(`duplicate section order "${order}" on site page "${sitePageId}"`);
    });
    [...orders].sort((left, right) => left - right).forEach((order, index) => {
      if (order !== index + 1) {
        errors.push(`section orders on site page "${sitePageId}" must be continuous from 1`);
      }
    });
  });
}

function validatePageStyleOwnership(sitePages, errors) {
  const pageScoped = new Map();
  const templateFamilies = new Map();
  sitePages.forEach((page) => {
    const target = page.styleScope === 'template-family' ? templateFamilies : pageScoped;
    const owner = page.styleScope === 'template-family' ? page.templateIntent : page.styleFile;
    if (!target.has(owner)) {
      target.set(owner, []);
    }
    target.get(owner).push(page);
  });

  pageScoped.forEach((pages, styleFile) => {
    if (pages.length > 1) {
      errors.push(`page-scoped style file "${styleFile}" is shared by multiple website pages: ${pages.map((page) => page.id).join(', ')}`);
    }
  });
  templateFamilies.forEach((pages, templateIntent) => {
    const styleFiles = [...new Set(pages.map((page) => page.styleFile))];
    if (styleFiles.length > 1) {
      errors.push(`template family "${templateIntent}" must resolve to one styleFile (found: ${styleFiles.join(', ')})`);
    }
  });
}

function validateSectionReferenceCoverage({ section, sectionSnapshot, sitePage, expectedLanguages, errors }) {
  if (!section.desktopNodeId || !section.desktopReference) {
    errors.push(`section "${section.id}" final desktop node requires a desktop reference`);
  }
  if (sitePage && sitePage.mobileSource && sitePage.mobileSource.mode === 'figma'
    && (!section.mobileNodeId || !section.mobileReference)) {
    errors.push(`section "${section.id}" belongs to a mobileSource=figma page and requires mobile node and reference coverage`);
  }
  if (Boolean(section.mobileNodeId) !== Boolean(section.mobileReference)) {
    errors.push(`section "${section.id}" mobile node and reference must be declared together`);
  }

  Object.entries(section.variants || {}).forEach(([language, variant]) => {
    if (!expectedLanguages.includes(language)) {
      errors.push(`section "${section.id}" variant "${language}" is outside project languages`);
    }
    if (!variant.desktopNodeId || !variant.desktopReference) {
      errors.push(`section "${section.id}" ${language} final desktop variant requires a desktop reference`);
    }
    if (Boolean(variant.mobileNodeId) !== Boolean(variant.mobileReference)) {
      errors.push(`section "${section.id}" ${language} mobile variant node and reference must be declared together`);
    }
    const sourceNodes = sectionSnapshot && sectionSnapshot.source && sectionSnapshot.source.languageNodes
      ? sectionSnapshot.source.languageNodes[language]
      : null;
    if (!sourceNodes) {
      errors.push(`section "${section.id}" ${language} manifest variant is missing its section language source`);
    }
  });

  const languageNodes = sectionSnapshot && sectionSnapshot.source
    ? sectionSnapshot.source.languageNodes || {}
    : {};
  Object.entries(languageNodes).forEach(([language, nodes]) => {
    if (!nodes || (!nodes.desktopNodeId && !nodes.mobileNodeId)) {
      return;
    }
    const variant = section.variants && section.variants[language];
    if (!variant) {
      errors.push(`section "${section.id}" ${language} language-specific source requires a manifest variant and reference coverage`);
      return;
    }
    ['desktopNodeId', 'mobileNodeId'].forEach((key) => {
      if ((nodes[key] || null) !== (variant[key] || null)) {
        errors.push(`section "${section.id}" ${language} variant has mismatched ${key}`);
      }
    });
  });
}

function validateSnapshot({
  project: providedProject,
  figmaConfig: providedFigmaConfig,
  paths: providedPaths
} = {}) {
  const errors = [];
  const project = providedProject || readRequiredJson(
    FACTORY_PATHS.project,
    'factory/project.json',
    errors
  );
  const figmaConfig = providedFigmaConfig || readRequiredJson(
    FACTORY_PATHS.figmaConfig,
    'factory/figma.json',
    errors
  );
  if (!project || !figmaConfig) {
    return { errors, manifest: null, siteMap: null, paths: null };
  }

  const paths = providedPaths || getSnapshotPaths(figmaConfig);
  const manifest = readRequiredJson(paths.manifest, 'manifest.json', errors);
  if (!manifest) {
    return { errors, manifest: null, siteMap: null, paths };
  }

  const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
  validateJsonArtifact({
    ajv,
    value: manifest,
    schemaPath: FACTORY_PATHS.manifestSchema,
    label: 'manifest',
    errors
  });
  if (manifest.status !== 'complete') {
    errors.push(`manifest status must be "complete" for validation (current: "${manifest.status || 'missing'}")`);
  }
  if (manifest.snapshotVersion !== figmaConfig.snapshotVersion) {
    errors.push(`manifest snapshotVersion "${manifest.snapshotVersion}" must match factory/figma.json "${figmaConfig.snapshotVersion}"`);
  }

  const expectedLanguages = Array.isArray(project.wordpress && project.wordpress.languages)
    ? project.wordpress.languages
    : [];
  const manifestLanguages = Array.isArray(manifest.languages) ? manifest.languages : [];
  if (!sameMembers(expectedLanguages, manifestLanguages)) {
    const missing = expectedLanguages.filter((language) => !manifestLanguages.includes(language));
    const unexpected = manifestLanguages.filter((language) => !expectedLanguages.includes(language));
    errors.push(`manifest languages must match project languages (missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'})`);
  }

  const figmaPages = Array.isArray(manifest.pages) ? manifest.pages : [];
  const figmaPageIds = figmaPages.map((page) => page.id).filter(Boolean);
  findDuplicates(figmaPageIds).forEach((id) => errors.push(`duplicate Figma page id "${id}"`));
  const figmaPageIdSet = new Set(figmaPageIds);
  const pagesFile = readRequiredJson(paths.pages, 'pages.json', errors);
  if (pagesFile && JSON.stringify(pagesFile) !== JSON.stringify(figmaPages)) {
    errors.push('pages.json must match the concise Figma PAGE inventory in manifest.json');
  }

  const siteMap = readRequiredJson(paths.siteMap, 'site-map.json', errors);
  validateJsonArtifact({
    ajv,
    value: siteMap,
    schemaPath: FACTORY_PATHS.siteMapSchema,
    label: 'site-map',
    errors
  });
  const sitePages = siteMap && Array.isArray(siteMap.pages) ? siteMap.pages : [];
  const sitePageIds = sitePages.map((page) => page.id).filter(Boolean);
  findDuplicates(sitePageIds).forEach((id) => errors.push(`duplicate website page id "${id}"`));
  const sitePageIdSet = new Set(sitePageIds);

  if (siteMap) {
    if (!sameMembers(expectedLanguages, siteMap.languages || [])) {
      errors.push('site-map languages must match factory/project.json exactly');
    }
    if (project.topology && project.topology !== 'auto' && project.topology !== siteMap.topology) {
      errors.push(`site-map topology "${siteMap.topology}" conflicts with explicit project topology "${project.topology}"`);
    }
    sitePages.forEach((page) => {
      if (!sameMembers(expectedLanguages, page.languages || [])) {
        errors.push(`site page "${page.id}" languages must match project languages`);
      }
      expectedLanguages.forEach((language) => {
        if (!page.languageRoutes || !page.languageRoutes[language]) {
          errors.push(`site page "${page.id}" is missing canonical route for language "${language}"`);
        }
      });
    });
    validatePageStyleOwnership(sitePages, errors);
    (siteMap.globalComponents || []).forEach((component) => {
      (component.usedByPages || []).forEach((pageId) => {
        if (!sitePageIdSet.has(pageId)) {
          errors.push(`global component "${component.id}" references unknown site page "${pageId}"`);
        }
      });
    });
  }

  const frames = Array.isArray(manifest.frames) ? manifest.frames : [];
  const frameNodeIds = frames.map((frame) => frame.nodeId).filter(Boolean);
  findDuplicates(frameNodeIds).forEach((id) => errors.push(`duplicate frame node id "${id}"`));
  const frameNodeIdSet = new Set(frameNodeIds);
  frames.forEach((frame) => {
    if (frame.pageId && !figmaPageIdSet.has(frame.pageId)) {
      errors.push(`frame "${frame.nodeId}" references unknown Figma page id "${frame.pageId}"`);
    }
  });
  sitePages.forEach((page) => {
    (page.sourceFrames || []).forEach((nodeId) => {
      if (!frameNodeIdSet.has(nodeId)) {
        errors.push(`site page "${page.id}" source frame "${nodeId}" is absent from manifest frames`);
      }
    });
  });

  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];
  const sectionIds = sections.map((section) => section.id).filter(Boolean);
  findDuplicates(sectionIds).forEach((id) => errors.push(`duplicate section id "${id}"`));
  validateContinuousOrders(sections, errors);
  const sectionIdSet = new Set(sectionIds);
  const validateSectionSchema = ajv.compile(readJson(FACTORY_PATHS.sectionSchema));

  sections.forEach((section) => {
    if (!sitePageIdSet.has(section.sitePageId)) {
      errors.push(`section "${section.id}" references unknown site page "${section.sitePageId}"`);
    }
    if (!figmaPageIdSet.has(section.figmaPageId)) {
      errors.push(`section "${section.id}" references unknown Figma page "${section.figmaPageId}"`);
    }
    if (!section.desktopNodeId || !frameNodeIdSet.has(section.desktopNodeId)) {
      errors.push(`section "${section.id}" desktopNodeId is missing from manifest frames`);
    }
    if (section.mobileNodeId && !frameNodeIdSet.has(section.mobileNodeId)) {
      errors.push(`section "${section.id}" mobileNodeId is missing from manifest frames`);
    }
    Object.entries(section.variants || {}).forEach(([language, variant]) => {
      ['desktopNodeId', 'mobileNodeId'].forEach((key) => {
        if (variant[key] && !frameNodeIdSet.has(variant[key])) {
          errors.push(`section "${section.id}" ${language} ${key} is absent from manifest frames`);
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
    if (sectionSnapshot.id !== section.id || sectionSnapshot.sitePageId !== section.sitePageId) {
      errors.push(`section snapshot "${section.id}" has mismatched identity`);
    }
    if (sectionSnapshot.order !== section.order) {
      errors.push(`section snapshot "${section.id}" has mismatched order`);
    }
    if (!sectionSnapshot.source || sectionSnapshot.source.figmaPageId !== section.figmaPageId) {
      errors.push(`section snapshot "${section.id}" has mismatched figmaPageId`);
    }
    ['desktopNodeId', 'mobileNodeId'].forEach((key) => {
      if (!sectionSnapshot.source || sectionSnapshot.source[key] !== (section[key] || null)) {
        errors.push(`section snapshot "${section.id}" has mismatched ${key}`);
      }
    });
    validateSectionReferenceCoverage({
      section,
      sectionSnapshot,
      sitePage: sitePages.find((page) => page.id === section.sitePageId),
      expectedLanguages,
      errors
    });
  });

  sitePages.forEach((page) => {
    const declared = sections
      .filter((section) => section.sitePageId === page.id)
      .sort((left, right) => left.order - right.order)
      .map((section) => section.id);
    if (JSON.stringify(declared) !== JSON.stringify(page.sections || [])) {
      errors.push(`site page "${page.id}" sections must match manifest order exactly`);
    }
  });

  (manifest.globalEffects || []).forEach((effect) => {
    if (!frameNodeIdSet.has(effect.sourceNodeId)) {
      errors.push(`global effect "${effect.id}" source node is absent from manifest frames`);
    }
    (effect.affectedPages || []).forEach((pageId) => {
      if (!sitePageIdSet.has(pageId)) {
        errors.push(`global effect "${effect.id}" affects unknown page "${pageId}"`);
      }
    });
    (effect.affectedSections || []).forEach((sectionId) => {
      if (!sectionIdSet.has(sectionId)) {
        errors.push(`global effect "${effect.id}" affects unknown section "${sectionId}"`);
      }
    });
  });

  [
    ['design-system.json', paths.designSystem, FACTORY_PATHS.designSystemSchema],
    ['components.json', paths.components, FACTORY_PATHS.componentsSchema],
    ['content-map.json', paths.contentMap, FACTORY_PATHS.contentMapSchema],
    ['assets.json', paths.assets, FACTORY_PATHS.assetsSchema]
  ].forEach(([label, filePath, schemaPath]) => {
    const value = readRequiredJson(filePath, label, errors);
    validateJsonArtifact({ ajv, value, schemaPath, label, errors });
  });

  [...collectDeclaredReferences(manifest), ...collectSiteMapReferences(siteMap)].forEach((reference) => {
    const referencePath = resolveSnapshotFile(paths.cacheRoot, reference.path);
    if (!referencePath) {
      errors.push(`${reference.owner} has an unsafe reference path`);
    } else if (!fs.existsSync(referencePath)) {
      errors.push(`${reference.owner} is missing file "${reference.path}"`);
    }
  });

  return { errors, manifest, siteMap, paths };
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

module.exports = {
  validatePageStyleOwnership,
  validateSectionReferenceCoverage,
  validateSnapshot
};
