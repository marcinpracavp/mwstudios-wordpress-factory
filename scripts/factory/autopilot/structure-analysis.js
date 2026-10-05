const { hash } = require('./common');

const CONTENT_KEYS = new Set([
  'characters', 'content', 'copy', 'description', 'fieldName', 'figmaUrl', 'href',
  'id', 'label', 'name', 'nodeId', 'path', 'sourceNodeId', 'text', 'title', 'url', 'value'
]);
const POSITION_KEYS = new Set(['absoluteBoundingBox', 'bounds', 'height', 'width', 'x', 'y']);
const STRUCTURAL_KEYS = new Set([
  'align', 'alignItems', 'axis', 'component', 'componentType', 'direction', 'display',
  'gap', 'itemSpacing', 'justify', 'justifyContent', 'layoutMode', 'layoutPositioning',
  'orientation', 'position', 'role', 'type', 'wrap'
]);

function semanticToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function aspectBucket(asset) {
  const width = Number(asset?.width);
  const height = Number(asset?.height);
  if (!(width > 0 && height > 0)) return 'unknown';
  const ratio = width / height;
  if (ratio > 2.2) return 'panoramic';
  if (ratio > 1.2) return 'landscape';
  if (ratio < 0.55) return 'tall';
  if (ratio < 0.82) return 'portrait';
  return 'square';
}

function normalizeLayout(value, key = '') {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(item => normalizeLayout(item, key)).filter(item => item !== null);
  if (typeof value !== 'object') {
    if (CONTENT_KEYS.has(key) || POSITION_KEYS.has(key)) return null;
    if (typeof value === 'string') return semanticToken(value);
    if (typeof value === 'number') return Math.round(value * 10) / 10;
    return value;
  }
  const normalized = {};
  for (const childKey of Object.keys(value).sort()) {
    if (CONTENT_KEYS.has(childKey) || POSITION_KEYS.has(childKey)) continue;
    const child = normalizeLayout(value[childKey], childKey);
    if (child === null || child === '' || (Array.isArray(child) && child.length === 0)) continue;
    if (STRUCTURAL_KEYS.has(childKey) || typeof child === 'object') normalized[childKey] = child;
  }
  return Object.keys(normalized).length ? normalized : null;
}

function fieldRole(field) {
  return semanticToken(field?.role || field?.semanticRole || field?.type || 'field');
}

function assetRole(asset) {
  return [
    semanticToken(asset?.role || asset?.semanticRole || 'media'),
    semanticToken(asset?.format || String(asset?.path || '').split('.').pop() || 'unknown'),
    aspectBucket(asset),
  ].join(':');
}

function controlRole(control) {
  return [semanticToken(control?.role || control?.type || 'control'), semanticToken(control?.interaction || control?.action || '')].join(':');
}

function sectionStructure(section = {}) {
  const snapshot = section.snapshotData || section.snapshot || section;
  const fields = section.editableContent || snapshot.contentFields || [];
  const assets = section.assets || snapshot.assets || [];
  const controls = snapshot.controls || snapshot.interactions || [];
  const layout = normalizeLayout(section.layout || snapshot.layout || null);
  const vector = {
    layoutKind: section.layoutKind || snapshot.layout?.type || 'unspecified',
    layout,
    fields: fields.map(fieldRole),
    assets: assets.map(assetRole),
    controls: controls.map(controlRole),
    background: assets.some(asset => /background|bg|backdrop|pattern/.test(assetRole(asset))),
    repeatedGroups: (section.fieldPlan?.repeaters || []).map(group => ({ itemCount: group.itemCount, fields: [...(group.fields || [])].sort() })),
  };
  const specificity = (layout ? 2 : 0) + vector.fields.length + vector.assets.length + vector.controls.length + Number(vector.background);
  const structuralEvidence = !!layout || vector.assets.length > 0 || vector.controls.length > 0 || vector.repeatedGroups.length > 0;
  return { vector, specificity, structuralEvidence, signature: hash(JSON.stringify(vector)).slice(0, 20) };
}

function canonicalRouteId(route, statePlans = []) {
  const state = statePlans.find(item => item.route === route.id);
  return state?.baseRoute || route.baseRoute || route.id;
}

function reusablePatterns(routes, statePlans = []) {
  const occurrences = new Map();
  for (const route of routes || []) for (const section of route.sections || []) {
    const structure = sectionStructure(section);
    if (!occurrences.has(structure.signature)) occurrences.set(structure.signature, []);
    occurrences.get(structure.signature).push({
      route: route.id,
      canonicalRoute: canonicalRouteId(route, statePlans),
      section: section.id,
      order: section.order,
      specificity: structure.specificity,
      structuralEvidence: structure.structuralEvidence,
    });
    section.patternSignature = structure.signature;
    section.structure = structure.vector;
  }
  return [...occurrences.entries()].map(([id, uses]) => {
    const canonicalRoutes = [...new Set(uses.map(use => use.canonicalRoute))];
    const confidence = uses.length > 1 && canonicalRoutes.length > 1
      && uses.every(use => use.structuralEvidence)
      && Math.min(...uses.map(use => use.specificity)) >= 3 ? 'high' : 'insufficient';
    return {
      id,
      kind: 'structural-pattern',
      uses,
      canonical: uses[0],
      confidence,
      autoShared: confidence === 'high',
      evidence: 'Exact normalized layout/field/asset/control structure; content, node IDs and URLs excluded.',
    };
  }).filter(pattern => pattern.uses.length > 1);
}

module.exports = { normalizeLayout, sectionStructure, reusablePatterns, canonicalRouteId, aspectBucket };
