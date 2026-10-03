// Deterministic page-composition projection built from the frozen Figma
// snapshot.  Workers receive one complete route blueprint and a narrower
// focus, rather than having to infer a page from an isolated crop.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, inside, read, write, hash } = require('./common');

const rel = file => path.relative(ROOT, file).replaceAll('\\', '/');
const value = (object, key, fallback = null) => object && object[key] !== undefined ? object[key] : fallback;

function snapshotFor(manifest, id) {
  const section = (manifest.sections || []).find(item => item.id === id);
  if (!section?.snapshot) return { section, snapshot: null, path: null };
  const file = inside(SNAPSHOT, section.snapshot);
  return { section, snapshot: fs.existsSync(file) ? read(file) : null, path: rel(file) };
}

function sourceNodeIds(snapshot) {
  return [...new Set([
    ...(snapshot?.contentFields || []).map(field => field.nodeId),
    ...(snapshot?.assets || []).map(asset => asset.sourceNodeId),
    ...(snapshot?.layout?.canvasTextNodes || []).map(node => node.nodeId),
  ].filter(Boolean))];
}

function layoutKind(snapshot) {
  if (snapshot?.layout?.type) return snapshot.layout.type;
  const assets = snapshot?.assets?.length || 0;
  const fields = snapshot?.contentFields || [];
  const text = fields.filter(field => ['text', 'textarea', 'wysiwyg'].includes(field.type)).length;
  if (assets && text) return 'media-content';
  if (assets) return 'media';
  if (text) return 'content';
  return 'unspecified';
}

function repeatedGroups(layout, pointer = '/layout', groups = []) {
  if (!layout || typeof layout !== 'object') return groups;
  for (const [key, item] of Object.entries(layout)) {
    const next=`${pointer}/${key}`;
    if (Array.isArray(item)) {
      if (item.length > 1 && item.every(value => value && typeof value === 'object' && !Array.isArray(value))) {
        const shapes=item.map(value=>Object.keys(value).sort().join(','));
        if(new Set(shapes).size===1)groups.push({sourcePointer:next,itemCount:item.length,fields:Object.keys(item[0]),recommendedType:'repeater'});
      }
      for(let index=0;index<item.length;index++)repeatedGroups(item[index],`${next}/${index}`,groups);
    } else repeatedGroups(item,next,groups);
  }
  return groups;
}

function sectionBlueprint(manifest, route, id, contentMap, registry) {
  const { section, snapshot, path: snapshotPath } = snapshotFor(manifest, id);
  const fields = (contentMap.fields || []).filter(field => field.section === id);
  const effectiveFields = fields.length ? fields : snapshot?.contentFields || [];
  const components = registry.filter(component => component.sections.includes(id)).map(component => component.id);
  const repeaters=repeatedGroups(snapshot?.layout);
  return {
    id,
    name: section?.name || snapshot?.name || id,
    order: route.sections.indexOf(id),
    expected: route.sectionGeometry?.[id] || snapshot?.desktop || null,
    snapshot: snapshotPath,
    reference: section?.desktopReference ? rel(inside(SNAPSHOT, section.desktopReference)) : null,
    layout: snapshot?.layout || null,
    layoutKind: layoutKind(snapshot),
    editableContent: effectiveFields.map(field => ({ nodeId: field.nodeId, fieldName: field.fieldName, type: field.type,
      returnFormat: field.returnFormat || null, language: field.language || route.language || null })),
    fieldPlan: { container:'acf-group', fields:effectiveFields.map(field=>({name:field.fieldName,type:field.type,returnFormat:field.returnFormat || null})),
      repeaters, rule:'Use a repeater only for a real repeated source group; otherwise retain explicit stable fields in the section group.' },
    assets: (snapshot?.assets || []).map(asset => ({ sourceNodeId: asset.sourceNodeId, role: asset.role || null,
      path: asset.path ? rel(inside(SNAPSHOT, asset.path)) : null, format: asset.format || null, width: asset.width || null, height: asset.height || null })),
    expectedSourceNodes: sourceNodeIds(snapshot),
    components,
    sourceGaps: [...(snapshot?.notes || []).filter(note => /\b(missing|absent|gap|unavailable|unresolved)\b/i.test(note)),
      ...(snapshot?.liveFigmaRequired ? ['liveFigmaRequired'] : [])],
  };
}

function signature(section) {
  return hash(JSON.stringify({ layoutKind: section.layoutKind,
    fields: section.editableContent.map(field => field.type).sort(),
    assets: section.assets.map(asset => asset.role || asset.format).sort(), components: section.components.sort() })).slice(0, 16);
}

function build(manifest, contentMap = { fields: [] }, registry = []) {
  const routes = (manifest.routes || []).map(route => {
    const sections = route.sections.map(id => sectionBlueprint(manifest, route, id, contentMap, registry));
    return {
      id: route.id, path: route.path, state: route.state || null, language: route.language || null,
      buildGroup: route.buildGroup || null, frameNodeId: route.frameNodeId || null,
      viewport: { width: route.width, sourceHeight: route.height },
      fullPageReference: route.reference ? rel(inside(SNAPSHOT, route.reference)) : null,
      sectionOrder: [...route.sections], sections,
      implementationIntent: 'Render the complete route in source order. Shared components may be reused, but every semantic section must own all of its visible media, text and controls.',
    };
  });
  const occurrences = new Map();
  for (const route of routes) for (const section of route.sections) {
    const key = signature(section);
    if (!occurrences.has(key)) occurrences.set(key, []);
    occurrences.get(key).push({ route: route.id, section: section.id });
    section.patternSignature = key;
  }
  const reusablePatterns = [...occurrences.entries()].filter(([, uses]) => uses.length > 1)
    .map(([id, uses]) => ({ id, uses }));
  return { version: 1, source: manifest.source || null, routes, reusablePatterns };
}

function create(manifest, output, registry = []) {
  const contentFile = path.join(SNAPSHOT, 'content-map.json');
  const contentMap = fs.existsSync(contentFile) ? read(contentFile) : { fields: [] };
  const blueprint = build(manifest, contentMap, registry);
  write(output, blueprint);
  return blueprint;
}

module.exports = { build, create, sourceNodeIds, layoutKind, repeatedGroups };
