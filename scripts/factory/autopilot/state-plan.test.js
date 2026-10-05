const test=require('node:test');
const assert=require('node:assert/strict');
const {classifyFamily}=require('./state-plan');

test('popup frame is classified as a delta over the canonical page',()=>{
  const family=classifyFamily({key:'home',baseRoute:'home',routes:[
    {id:'home',sections:[
      {id:'hero',sourceCropHash:'hero',structureSignature:'hero',width:1440,height:700},
      {id:'cta',sourceCropHash:'cta',structureSignature:'cta',width:1440,height:400},
    ]},
    {id:'home-popup',state:'popup-open',sections:[
      {id:'hero-state',sourceCropHash:'hero',structureSignature:'hero',width:1440,height:700},
      {id:'cta-state',sourceCropHash:'cta',structureSignature:'cta',width:1440,height:400},
      {id:'newsletter-popup',name:'Newsletter dialog',sourceCropHash:'popup',structureSignature:'dialog',width:600,height:500,layoutKind:'overlay'},
    ]},
  ]});
  const state=family.routes[1];
  assert.equal(state.overlayOnly,true);
  assert.deepEqual(state.sections.filter(section=>section.sharedWithBase).map(section=>section.id),['hero-state','cta-state']);
  assert.deepEqual(state.sections.filter(section=>section.change==='added').map(section=>section.id),['newsletter-popup']);
});

test('changed page content remains a state delta but is not treated as an overlay-only state',()=>{
  const family=classifyFamily({key:'account',baseRoute:'account',routes:[
    {id:'account',sections:[{id:'form',sourceCropHash:'closed',structureSignature:'form',width:800,height:600}]},
    {id:'account-error',state:'error',sections:[{id:'form',sourceCropHash:'error',structureSignature:'form',width:800,height:640}]},
  ]});
  assert.equal(family.routes[1].overlayOnly,false);
  assert.equal(family.routes[1].sections[0].change,'changed');
});

test('an overlay may change composite crop pixels without turning the covered base page into a rebuild',()=>{
  const family=classifyFamily({key:'home',baseRoute:'home',routes:[
    {id:'home',sections:[
      {id:'hero',sourceCropHash:'hero-clear',structureSignature:'hero-layout',width:1440,height:700},
      {id:'cta',sourceCropHash:'cta-clear',structureSignature:'cta-layout',width:1440,height:400},
    ]},
    {id:'home-popup',state:'popup-open',sections:[
      {id:'hero',sourceCropHash:'hero-covered',structureSignature:'hero-layout',width:1440,height:700},
      {id:'cta',sourceCropHash:'cta-covered',structureSignature:'cta-layout',width:1440,height:400},
      {id:'newsletter-popup',name:'Newsletter modal',sourceCropHash:'popup',structureSignature:'dialog',width:600,height:500,layoutKind:'overlay'},
    ]},
  ]});
  const state=family.routes[1];
  assert.equal(state.overlayOnly,true);
  assert.deepEqual(state.sections.filter(section=>section.sharedWithBase).map(section=>section.id),['hero','cta']);
  assert.equal(state.sections.find(section=>section.id==='hero').occludedByOverlay,true);
});
