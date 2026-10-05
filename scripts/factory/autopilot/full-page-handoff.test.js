const test = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('./full-page-handoff');

test('exhausted full-page build becomes a measured repair handoff, never visual acceptance', () => {
  const handoff = create({ id: 'route-home', sections: ['hero', 'features'] }, 'v2:build:route-home', [{
    pagePassed: false,
    routes: [{ id: 'home', pagePassed: false, comparison: '.factory-cache/run/home/comparison.json' }]
  }]);
  assert.equal(handoff.result.status, 'passed');
  assert.match(handoff.result.summary, /diagnosis and repair cycle/);
  assert.deepEqual(handoff.result.evidence, ['.factory-cache/run/home/comparison.json']);
  assert.deepEqual(handoff.deferred.routes, ['home']);
  assert.deepEqual(handoff.deferred.sections, ['hero', 'features']);
  assert.match(handoff.deferred.reason, /not visual acceptance/);
});

test('a passed page or missing comparison does not create a repair handoff', () => {
  assert.equal(create({ id: 'route-home' }, 'task', [{ routes: [{ id: 'home', pagePassed: true, comparison: 'comparison.json' }] }]), null);
  assert.equal(create({ id: 'route-home' }, 'task', [{ routes: [{ id: 'home', pagePassed: false }] }]), null);
});
