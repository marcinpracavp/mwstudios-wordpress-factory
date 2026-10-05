const test=require('node:test');
const assert=require('node:assert/strict');
const {selectBlueprints}=require('./task-capsule');

test('state capsule receives only its state route, canonical base and relevant reusable patterns',()=>{
  const all={routes:[{id:'home'},{id:'home-popup'},{id:'service'}],reusablePatterns:[
    {id:'cta',uses:[{route:'home'},{route:'service'}]},
    {id:'service-only',uses:[{route:'service'}]},
  ]};
  const {routeBlueprints}=selectBlueprints(all,{routes:[{id:'home-popup'}],baseRoute:'home'});
  assert.deepEqual(routeBlueprints.routes.map(route=>route.id),['home','home-popup']);
  assert.deepEqual(routeBlueprints.reusablePatterns.map(pattern=>pattern.id),['cta']);
});
