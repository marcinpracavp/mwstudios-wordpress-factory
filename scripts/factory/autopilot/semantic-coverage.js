// Verify that a measured semantic section owns the source-backed content and
// media assigned to it. Pixel-perfect crops cannot compensate for a heading,
// CTA or image living outside the section wrapper.
const fs = require('fs');
const { SNAPSHOT, inside, read } = require('./common');
const { sourceNodeIds } = require('./route-blueprint');

function expected(manifest, id) {
  const section = (manifest.sections || []).find(item => item.id === id);
  if (!section?.snapshot) return [];
  const file = inside(SNAPSHOT, section.snapshot);
  return fs.existsSync(file) ? sourceNodeIds(read(file)) : [];
}

function inspect(manifest, route, metrics, ids = route.sections) {
  const known = new Set(route.sections || []);
  const sourceNodes = metrics.sourceNodes || [];
  const sections = ids.map(id => {
    const required = expected(manifest, id);
    const owned = [...new Set(sourceNodes.filter(node => node.section === id).map(node => node.nodeId).filter(Boolean))];
    const missing = required.filter(nodeId => !owned.includes(nodeId));
    const outside = sourceNodes.filter(node => required.includes(node.nodeId) && node.section !== id)
      .map(node => ({ nodeId: node.nodeId, actualSection: node.section || null, tag: node.tag }));
    return { id, passed: missing.length === 0, expectedSourceNodes: required, ownedSourceNodes: owned, missingSourceNodes: missing, outsideSection: outside };
  });
  const unregisteredSections = (metrics.sections || []).filter(section => !section.parentSection && !known.has(section.id))
    .map(section => ({ id: section.id, component: section.component || null, x: section.x, y: section.y, width: section.width, height: section.height }));
  return { passed: sections.every(section => section.passed) && unregisteredSections.length === 0, sections, unregisteredSections };
}

module.exports = { expected, inspect };
