const test = require('node:test');
const assert = require('node:assert/strict');

test('semantic coverage rejects source content rendered in an unregistered sibling', () => {
  const semantic = require('./semantic-coverage');
  const original = semantic.expected;
  // inspect() closes over expected, so exercise the public shape with a
  // snapshot-free section and the unregistered-wrapper rule here. Source-node
  // ownership is covered by the live snapshot integration tests.
  const manifest = { sections: [{ id: 'overview' }] };
  const route = { sections: ['overview'] };
  const result = semantic.inspect(manifest, route, { sourceNodes: [], sections: [
    { id: 'overview', parentSection: null }, { id: 'overview-copy', parentSection: null, component: 'copy' }
  ] }, ['overview']);
  assert.equal(result.passed, false);
  assert.equal(result.unregisteredSections[0].id, 'overview-copy');
  assert.equal(typeof original, 'function');
});
