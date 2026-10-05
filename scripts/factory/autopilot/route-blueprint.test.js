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

test('route blueprint promotes identical structures across pages but not state-only copies', () => {
  const manifest = { source: { fileKey: 'x' }, sections: [
    { id: 'home-cta', name: 'CTA', snapshot: null, snapshotData: { layout: { type: 'cta', direction: 'row', children: [{ type: 'content' }, { type: 'button' }] } } },
    { id: 'service-cta', name: 'CTA variant', snapshot: null, snapshotData: { layout: { type: 'cta', direction: 'row', children: [{ type: 'content' }, { type: 'button' }] } } },
    { id: 'popup', name: 'Popup', snapshot: null },
  ], routes: [
    { id: 'home', path: '/', width: 1440, height: 1200, sections: ['home-cta'] },
    { id: 'service', path: '/service/', width: 1440, height: 1200, sections: ['service-cta'] },
    { id: 'home-popup', path: '/', state: 'popup-open', width: 1440, height: 1200, sections: ['home-cta', 'popup'] },
  ] };
  const fields = { fields: [
    { section: 'home-cta', nodeId: '1', fieldName: 'heading', type: 'text' },
    { section: 'home-cta', nodeId: '1a', fieldName: 'body', type: 'wysiwyg' },
    { section: 'home-cta', nodeId: '1b', fieldName: 'button', type: 'link' },
    { section: 'service-cta', nodeId: '2', fieldName: 'heading', type: 'text' },
    { section: 'service-cta', nodeId: '2a', fieldName: 'body', type: 'wysiwyg' },
    { section: 'service-cta', nodeId: '2b', fieldName: 'button', type: 'link' },
    { section: 'popup', nodeId: '3', fieldName: 'dialog', type: 'wysiwyg' },
  ] };
  const statePlans = [{ route: 'home-popup', baseRoute: 'home' }];
  const blueprint = build(manifest, fields, [], statePlans);
  const shared = blueprint.reusablePatterns.find(pattern => pattern.uses.some(use => use.section === 'home-cta'));
  assert.equal(shared.autoShared, true);
  assert.equal(blueprint.routes.find(route => route.id === 'home-popup').sections[0].reuse.pattern, shared.id);
});
