const test = require('node:test');
const assert = require('node:assert/strict');
const { plan } = require('./discovery-plan');

test('discovery creates one complete-frame task per route and state', () => {
  const manifest = { routes: [
    { id: 'service', path: '/service/', buildGroup: 'service', frameNodeId: '1:1', sections: ['header', 'body', 'cta', 'footer'] },
    { id: 'home-popup', path: '/', state: 'popup-open', buildGroup: 'home', frameNodeId: '1:3', sections: ['header', 'hero', 'cta', 'popup', 'footer'] },
    { id: 'home', path: '/', buildGroup: 'home', frameNodeId: '1:2', sections: ['header', 'hero', 'cta', 'footer'] },
  ] };
  const tasks = plan(manifest);
  assert.deepEqual(tasks.map(task => task.routes[0].id), ['home', 'home-popup', 'service']);
  assert.equal(tasks.length, manifest.routes.length);
  assert.equal(tasks.every(task => task.scope === 'route' && task.routes.length === 1), true);
  assert.deepEqual(tasks[0].sections, ['header', 'hero', 'cta', 'footer']);
  assert.equal(tasks.some(task => task.id.includes('detail-')), false);
});
