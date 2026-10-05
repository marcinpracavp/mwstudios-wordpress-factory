const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),os=require('os');
const {diagnose}=require('./diagnostics'),{routeTask}=require('./model-router');
const config={taskBudgets:{maxInputTokens:2000000,maxOutputTokens:12000,maxUncachedTokens:100000,maxAttempts:4,maxPromptBytes:22000}};
const comparison=(ratio=0)=>({passed:true,sourceHash:'test-source',routes:[{id:'home',ownership:{page:{pixels:1000,ratio}}}]});
test('byte guard is independent from token limit and prevents oversized individual reads',()=>{
  const exceeded=require('./context-budget').exceeded,budget={remainingUncachedTokens:100000,remainingOutputTokens:12000};
  assert.equal(exceeded({observedBytes:102120,outputBytes:1000,itemBytes:12000,budget}),false);
  assert.equal(exceeded({observedBytes:270000,outputBytes:1000,itemBytes:235000,budget}),true);
});
test('content batches combine small sections while retaining exact record identities and limits',()=>{
  const fields=Array.from({length:11},(_,i)=>({type:'product',language:'pl',nodeId:`n${i}`,fieldName:'card',section:'listing'}));
  const plan=require('./content-batches').plan({fields},{routes:[{id:'shop',sections:['listing']}]});
  assert.equal(new Set(plan.map(t=>t.id)).size,plan.length);
  for(const t of plan){assert.ok(t.contentRecords.length<=6);assert.equal(t.budget.maxUncachedTokens,400000);assert.equal(t.budget.maxOutputTokens,50000);}
  assert.equal(plan.filter(t=>t.class==='product-import').flatMap(t=>t.contentKeys).length,11);
  assert.equal(plan.filter(t=>t.class==='listing-bind').flatMap(t=>t.contentKeys).length,11);
  const shuffled=require('./content-batches').plan({fields:[...fields].reverse()},{routes:[]});
  assert.deepEqual(plan.filter(t=>t.class==='product-import').map(t=>t.id),shuffled.filter(t=>t.class==='product-import').map(t=>t.id));
  assert.throws(()=>routeTask(config,{id:'batch',class:'product-import'},[{usage:{input_tokens:120000,cached_input_tokens:30000,output_tokens:10000}}]),/UNCACHED_BUDGET/);
  const compact=require('./content-batches').plan({fields:[
    {type:'text',language:'pl',nodeId:'a',fieldName:'title',section:'header'},
    {type:'text',language:'pl',nodeId:'b',fieldName:'title',section:'hero'}
  ]},{routes:[]});
  assert.equal(compact.filter(t=>t.class==='content-import').length,1);
  assert.equal(compact[0].contentRecords.length,2);
  assert.throws(()=>routeTask({...config,maxStageAttempts:2},{id:'retry-cap',class:'product-import'},[
    {modelAlias:'luna',status:'needs_work',result:{status:'needs_work'}},
    {modelAlias:'terra',status:'needs_work',result:{status:'needs_work'}}
  ]),/TASK_ATTEMPTS_EXHAUSTED/);
});
test('responsive global overflow needs every route; inaccessible states never escalate to Terra',()=>{
  const rows=['a','b','c'].map(id=>({id,responsive:[{width:390,overflow:25}]}));
  assert.equal(diagnose(rows)[0].class,'global-css');
  rows[2].responsive=[];assert.equal(diagnose(rows).some(t=>t.global),false);
  const unavailable=diagnose([{id:'order',rendered:{height:900},reference:{height:2000},geometry:[]}])[0];
  assert.equal(unavailable.class,'unavailable-state');
  assert.equal(routeTask(config,unavailable,[{modelAlias:'luna',status:'needs_work',result:{status:'needs_work'}}]).alias,'luna');
  const local=diagnose([{id:'shop',geometry:[{id:'list',owner:'page',passed:false,actual:{height:700},delta:{height:70}}]}])[0];
  assert.equal(local.class,'local-section');assert.deepEqual(local.sections,['list']);
  const js=diagnose([{id:'home',errors:['TypeError: undefined']}])[0];
  assert.equal(routeTask(config,js).type,'interaction');
});
test('a scoped correction gets one Figma source-recovery turn after Luna and Terra',()=>{
  const recovery=routeTask({...config,maxStageAttempts:2},{id:'round-2-section-20',class:undefined,type:'source-extraction',sourceRecovery:true,
    sections:['product-list-menu'],budget:{maxAttempts:3}},[
    {modelAlias:'luna',status:'needs_work',result:{status:'needs_work'}},
    {modelAlias:'terra',status:'needs_work',result:{status:'needs_work'}}
  ]);
  assert.equal(recovery.type,'source-extraction');
  assert.equal(recovery.alias,'luna');
  assert.equal(recovery.budget.maxAttempts,3);
});
test('final audit invokes Sol once, repairs minor issues with Luna, recaptures and fails closed',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'factory-final-test-'));
  try{
    let calls=0,repairs=0,builds=0,captures=0;
    const args={dir,threshold:.04,comparison:comparison(.041),invoke:async mode=>{calls++;assert.equal(mode,'pixel-perfect');return {status:'needs_work',issues:['home hero margin: 4px expected 0px']};},
      repair:async task=>{repairs++;assert.equal(task.onlyModel,'luna');},build:async()=>{builds++;},capture:async()=>{captures++;return comparison();}};
    await require('./final-audit').run(args);await require('./final-audit').run(args);
    assert.equal(calls,1);assert.equal(captures,2);assert.equal(builds,2);assert.ok(repairs>0);
    await assert.rejects(require('./final-audit').run({...args,comparison:{...comparison(),sourceHash:'changed'}}),/SOURCE_CHANGED/);
    await assert.rejects(require('./final-audit').run({...args,threshold:.039}),/THRESHOLD_CHANGED/);
    await assert.rejects(require('./final-audit').run({...args,capture:async()=>comparison(.041)}),/MEASURED_CHECKS_FAILED/);
    assert.throws(()=>require('./final-audit').ratio({routes:[]}),/EVIDENCE_MISSING/);
  }finally{if(path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('factory-final-test-'))fs.rmSync(dir,{recursive:true});}
});
test('interrupted Sol audit reconciles existing session without starting another',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'factory-final-test-'));let calls=0;
  try{
    const args={dir,comparison:comparison(),invoke:async()=>{calls++;throw Error('capacity');},repair:async()=>{},build:async()=>{},capture:async()=>comparison()};
    await assert.rejects(require('./final-audit').run(args),/capacity/);
    await assert.rejects(require('./final-audit').run(args),/INTERRUPTED/);
    await require('./final-audit').run({...args,reconcile:async()=>({status:'passed',issues:[]})});assert.equal(calls,1);
  }finally{if(path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('factory-final-test-'))fs.rmSync(dir,{recursive:true});}
});
