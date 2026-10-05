const test=require('node:test');
const assert=require('node:assert/strict');
const {plan}=require('./component-plan');

const manifest={sections:['header','home-body','home-cta','service-body','service-cta','popup','footer'].map(id=>({id})),routes:[
  {id:'home',path:'/',buildGroup:'home',width:1440,sections:['header','home-body','home-cta','footer']},
  {id:'service',path:'/service/',buildGroup:'service',width:1440,sections:['header','service-body','service-cta','footer']},
  {id:'home-popup',path:'/',state:'popup-open',buildGroup:'home',width:1440,sections:['header','home-body','home-cta','popup','footer']},
]};
const families={families:[{key:'home',baseRoute:'home',routes:[
  {id:'home',mode:'base',sections:manifest.routes[0].sections.map(id=>({id,change:'base',sharedWithBase:false,baseSectionId:id}))},
  {id:'home-popup',mode:'state-delta',overlayOnly:true,removedSections:[],sections:[
    {id:'header',change:'reused',sharedWithBase:true,baseSectionId:'header'},
    {id:'home-body',change:'reused',sharedWithBase:true,baseSectionId:'home-body'},
    {id:'home-cta',change:'reused',sharedWithBase:true,baseSectionId:'home-cta'},
    {id:'popup',change:'added',sharedWithBase:false,baseSectionId:null},
    {id:'footer',change:'reused',sharedWithBase:true,baseSectionId:'footer'},
  ]},
]}]};
const blueprint={reusablePatterns:[{id:'cta-pattern',autoShared:true,canonical:{route:'home',section:'home-cta'},evidence:'same structure',uses:[
  {route:'home',canonicalRoute:'home',section:'home-cta'},
  {route:'service',canonicalRoute:'service',section:'service-cta'},
]}]};

test('planner creates one base-page task, one shared CTA and a popup-only state task',()=>{
  const result=plan(manifest,families,[],blueprint);
  assert.equal(result.shared.filter(task=>task.mode==='shared-pattern').length,1);
  assert.deepEqual(result.pages.map(task=>task.id),['route-home','route-service']);
  assert.deepEqual(result.states.map(task=>task.id),['route-home-popup']);
  assert.deepEqual(result.states[0].sections,['popup']);
  assert.equal(result.states[0].baseRoute,'home');
  assert.equal(result.states[0].stateDelta.overlayOnly,true);
  assert.equal(result.pages.find(task=>task.id==='route-service').reuseComponents.includes('pattern-cta-pattern'),true);
});
