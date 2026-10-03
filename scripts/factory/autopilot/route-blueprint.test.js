const test = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('./route-blueprint');

test('route blueprint retains complete route order and identifies reusable layout patterns', () => {
  const manifest = { source: { fileKey: 'x' }, sections: [
    { id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }
  ], routes: [
    { id: 'one', path: '/one', width: 1920, height: 2000, sections: ['a', 'b'], sectionGeometry: { a: { x: 0, y: 0, width: 1920, height: 500 } } },
    { id: 'two', path: '/two', width: 1920, height: 1800, sections: ['a', 'c'] }
  ] };
  const blueprint = build(manifest, { fields: [
    { section: 'a', nodeId: '1:1', fieldName: 'title', type: 'text' },
    { section: 'b', nodeId: '1:2', fieldName: 'body', type: 'wysiwyg' },
    { section: 'c', nodeId: '1:3', fieldName: 'body', type: 'wysiwyg' }
  ] });
  assert.deepEqual(blueprint.routes[0].sectionOrder, ['a', 'b']);
  assert.equal(blueprint.routes[0].sections[0].expected.width, 1920);
  assert.equal(blueprint.routes[0].sections[1].editableContent[0].type, 'wysiwyg');
  assert.equal(blueprint.reusablePatterns.some(pattern => pattern.uses.length > 1), true);
});
