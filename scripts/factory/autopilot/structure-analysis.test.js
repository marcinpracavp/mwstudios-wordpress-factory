const test = require('node:test');
const assert = require('node:assert/strict');
const { sectionStructure, reusablePatterns } = require('./structure-analysis');

const cta = (id, heading, button) => ({
  id,
  order: 2,
  layoutKind: 'call-to-action',
  layout: { type: 'section', direction: 'horizontal', children: [
    { type: 'background', role: 'background', nodeId: `${id}:1` },
    { type: 'content', direction: 'vertical', children: [{ type: 'text', characters: heading }, { type: 'button', characters: button }] },
  ] },
  editableContent: [{ type: 'text', value: heading }, { type: 'text', value: button }],
  assets: [{ role: 'background', format: 'webp', width: 1600, height: 500, sourceNodeId: `${id}:2`, path: `${id}.webp` }],
  snapshotData: { controls: [{ role: 'button', interaction: 'navigate', label: button }] },
});

test('same CTA layout with different copy and source IDs has one structural signature', () => {
  assert.equal(sectionStructure(cta('a', 'Ask us', 'Contact')).signature, sectionStructure(cta('b', 'Need service?', 'Write')).signature);
});

test('different content arrangement is not collapsed into the same component', () => {
  const first = cta('a', 'Ask us', 'Contact');
  const second = cta('b', 'Need service?', 'Write');
  second.layout.direction = 'vertical';
  assert.notEqual(sectionStructure(first).signature, sectionStructure(second).signature);
});

test('state copies do not by themselves prove a shared cross-page component', () => {
  const section = cta('cta', 'Ask us', 'Contact');
  const routes = [
    { id: 'home', sections: [structuredClone(section)] },
    { id: 'home-popup', baseRoute: 'home', sections: [structuredClone(section)] },
  ];
  const patterns = reusablePatterns(routes, [{ route: 'home-popup', baseRoute: 'home' }]);
  assert.equal(patterns[0].autoShared, false);
});

test('same high-specificity CTA on different canonical pages is auto-shared', () => {
  const routes = [
    { id: 'home', sections: [cta('home-cta', 'Ask us', 'Contact')] },
    { id: 'service', sections: [cta('service-cta', 'Need service?', 'Write')] },
  ];
  const patterns = reusablePatterns(routes);
  assert.equal(patterns[0].autoShared, true);
  assert.deepEqual(patterns[0].uses.map(use => use.section), ['home-cta', 'service-cta']);
});

test('matching content fields without layout evidence are not auto-promoted', () => {
  const routes = ['one', 'two'].map(id => ({ id, sections: [{ id: `${id}-copy`, editableContent: [
    { type: 'text' }, { type: 'wysiwyg' }, { type: 'link' },
  ] }] }));
  const pattern = reusablePatterns(routes)[0];
  assert.equal(pattern.autoShared, false);
  assert.equal(pattern.confidence, 'insufficient');
});
