// Real host orchestration with controlled worker/browser/WordPress boundaries.
// The separate smoke test exercises a live Luna and a real browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
test('shared-first host gate, capacity pause, missing-only resume, Luna escalation and final Sol polish', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-v2-pipeline-'));
  process.env.FACTORY_AUTOPILOT_ROOT = root;
  const common = require('./common'), { write, read } = common;
  const replace = (name, exports) => { const id = require.resolve(name); require.cache[id] = { id, filename: id, loaded: true, exports }; };
  common.resolveCodex = () => ({ file: 'controlled-worker', version: 'test' });
  const config = { version: 2, toolOutputTokenLimit: 2000, maxRepairPasses: 3, maxStageAttempts: 2, stageTimeoutMinutes: 5,
    maxUncachedTokens: 100000, visual: { maxDifferentPixelRatio: 0.085, geometryTolerancePx: 2, channelTolerance: 24 },
    taskBudgets: { maxInputTokens: 100000, maxOutputTokens: 10000, maxAttempts: 4, maxPromptBytes: 22000 } };
  write(path.join(root, 'factory/autopilot.json'), config);
  write(path.join(root, 'factory/project.json'), { project: { name: 'Controlled test' }, environment: { localUrl: 'http://test.invalid' }, figma: { url: 'https://www.figma.com/design/testkey/test' } });
  const manifest = { status: 'complete', source: { fileKey: 'testkey' }, sections: ['shared-header','body','shared-footer'].map(id=>({id,snapshot:`${id}.json`})),
    routes: ['home','about'].map((id,i)=>({id,path:i?'/about':'/',buildGroup:id,width:1920,sections:['shared-header',id==='home'?'body':'about-body','shared-footer']})) };
  manifest.sections.push({id:'about-body',snapshot:'about-body.json'});
  write(path.join(common.SNAPSHOT, 'manifest.json'), manifest);
  for (const s of manifest.sections) write(path.join(common.SNAPSHOT,s.snapshot),{id:s.id,desktop:{x:0,y:0,width:1920,height:100}});
  write(path.join(common.SNAPSHOT,'content-map.json'),{fields:[]});
  write(path.join(root,'src/global.json'),{test:true});
  write(path.join(root,'custom-instructions.json'),{all:'CONTROLLED_PIPELINE_TEST'});
  write(path.join(root,'scripts/factory/figma/validate-snapshot.js'),{});
  const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../factory/schemas/autopilot-result.schema.json')));
  write(path.join(root,'factory/schemas/autopilot-result.schema.json'),schema);
  replace('./wp',{wp:()=> 'http://test.invalid'});
  replace('./gates',{inventory:()=>({passed:true,errors:[]}),group:()=>({passed:true,errors:[]}),snapshot:()=>({passed:true,errors:[]})});
  replace('./source-geometry',{resolveManifest:()=>manifest});
  replace('./state-plan',{load:()=>null,routePlan:()=>null});
  replace('./reconcile-discovery',{reconcile:async()=>{throw Error('Complete source snapshot must not be reconciled as partial');}});
  replace('./observations',{recover:async()=>{}});
  let checks=0;
  const built = new Set();
  replace('./component-visual',{capture:async({route,sections,output})=>{
    checks++;
    const passed=sections.every(id=>built.has(id));
    const proof={passed,sections:sections.map(id=>({id,passed})),errors:[],route:typeof route==='string'?route:route.id};
    write(path.join(output,'comparison.json'),proof);
    return {...proof,evidence:path.relative(root,path.join(output,'comparison.json')).replaceAll('\\','/')};
  }});
  replace('./visual',{sourceHash:()=> 'source-test',captureAll:async({output})=>{
    const result={passed:true,implementationHash:common.fingerprint(),sourceHash:'source-test',routes:manifest.routes.map(r=>{
      const file=path.join(output,r.id,'comparison.json');write(file,{id:r.id,passed:true,errors:[],geometry:[]});
      return {id:r.id,passed:true,comparison:path.relative(root,file).replaceAll('\\','/')};
    })};write(path.join(output,'summary.json'),result);return result;
  }});
  let pending=true;
  replace('./audit-progress',{resumeComparison:()=>null,initialize:()=> 'ledger-test',status:()=>[{id:'test-unit',pending:pending?['test-item']:[],completed:pending?0:1,total:1}],
    packet:()=>({file:'audit-packet.json',key:'test',pending:[{id:'test-item',kind:'visual',section:'body'}],unit:{routes:['home']}}),aggregate:()=>({status:'passed',issues:[],evidence:[]})});
  let interruptFooter=true, reportFooterOverrun=true;
  const calls=[];
  const deps={command:(_file,_args,log)=>{fs.mkdirSync(path.dirname(log),{recursive:true});fs.writeFileSync(log,'controlled command success');},
    session:async({stage,task,routing,dir})=>{
      calls.push({stage,id:task.id,sections:task.sections,model:routing.alias,type:task.type});
      if(stage==='foundation'&&task.sections?.includes('shared-footer')&&interruptFooter){
        interruptFooter=false;const e=Error('AGENT_EXECUTION_FAILED: controlled capacity interruption');
        e.execution={completed:false,startedModel:routing.model,usage:null};write(path.join(dir,'execution.json'),e.execution);throw e;
      }
      if(stage==='audit')pending=false;
      if(stage!=='discovery')for(const section of task.sections || []) if(section!=='shared-header'||routing.alias!=='luna')built.add(section);
      const proof=path.join(dir,'proof.json');write(proof,{observed:true});
      const result={status:'passed',summary:'Controlled worker complete',issues:[],evidence:[path.relative(root,proof).replaceAll('\\','/')]};
      const execution={completed:true,startedModel:routing.model,usage:{input_tokens:100,cached_input_tokens:50,output_tokens:20},result};
      if(stage==='foundation'&&task.sections?.includes('shared-footer')&&reportFooterOverrun){
        reportFooterOverrun=false;execution.failure={message:'TASK_REPORTED_TOKEN_BUDGET'};
        write(path.join(dir,'execution.json'),execution);write(path.join(dir,'result.json'),result);
        const e=Error('AGENT_EXECUTION_FAILED: TASK_REPORTED_TOKEN_BUDGET');e.execution=execution;throw e;
      }
      write(path.join(dir,'execution.json'),execution);write(path.join(dir,'result.json'),result);return execution;
    }};
  try {
    const {main}=require('./run');
    await main(['run'],deps);
    const pointer=read(path.join(common.CACHE,'current-v2.json'));
    assert.equal(read(pointer.state).status,'paused');
    assert.equal(calls.some(c=>c.stage==='build'),false,'No page worker before all shared components pass');
    assert.deepEqual(calls.filter(c=>c.sections?.includes('shared-header')&&c.stage==='foundation').map(c=>c.model),['luna','terra']);
    const before=calls.length;process.exitCode=0;
    await main(['resume'],deps);
    const resumed=calls.slice(before);
    assert.equal(resumed.some(c=>c.stage==='discovery'),false,'Completed source fragments must be reused after source freeze');
    assert.equal(resumed.some(c=>c.stage==='foundation'&&c.id==='global-layout'),false);
    assert.equal(resumed.some(c=>c.stage==='foundation'&&c.sections?.includes('shared-header')),false);
    assert.equal(resumed.find(c=>c.stage==='foundation'&&c.sections?.includes('shared-footer')).model,'luna');
    assert.equal(read(pointer.state).status,'paused');
    const footerCalls=calls.filter(c=>c.stage==='foundation'&&c.sections?.includes('shared-footer')).length;
    process.exitCode=0;await main(['resume'],deps);
    assert.equal(calls.filter(c=>c.stage==='foundation'&&c.sections?.includes('shared-footer')).length,footerCalls,'Completed over-budget result is revalidated without another model call');
    assert.equal(read(pointer.state).status,'complete');
    assert.ok(calls.some(c=>c.model==='sol'&&c.type==='final-polish'));
    assert.ok(checks>4);
    const usage=read(path.join(path.dirname(pointer.state),'usage-summary.json'));
    assert.ok(usage.byModel.luna.sessions>0&&usage.byModel.sol.sessions>0);
  } finally {
    process.exitCode=0;
    if(path.dirname(root)===os.tmpdir()&&path.basename(root).startsWith('factory-v2-pipeline-'))fs.rmSync(root,{recursive:true});
  }
});
