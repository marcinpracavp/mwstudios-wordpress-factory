const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm'),crypto=require('crypto');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'factory-audit-test-'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
const text=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
const inside=(base,file)=>{const target=path.resolve(base,file),r=path.relative(base,target);if(r==='..'||r.startsWith('..'+path.sep)||path.isAbsolute(r))throw Error('outside');return target;};
let implementation='one';
const manifest={routes:[{id:'home'},{id:'active',state:'open'}]};
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
try {
  write(path.join(root,'factory/autopilot.json'),{visual:{maxDifferentPixelRatio:0.085}});
  for(const f of ['visual.js','visual-ownership.js','template-evidence.js','audit-progress.js'])text(path.join(root,f),'test-code');
  text(path.join(root,'snapshot/reference.png'),'test-reference');text(path.join(root,'capture/rendered.png'),'test-render');
  text(path.join(root,'capture/mobile.png'),'test-mobile');text(path.join(root,'probe.json'),'test-observation');
  write(path.join(root,'capture/comparison.json'),{rendered:{path:'capture/rendered.png'},reference:{path:'reference.png'},
    responsive:[{screenshot:'capture/mobile.png'}],geometry:[{id:'body',owner:'page',expected:{width:10,height:10}}],pixels:{crops:[]}});
  write(path.join(root,'capture/summary.json'),{implementationHash:'one',sourceHash:'source',thresholds:{maxDifferentPixelRatio:0.085},routes:[{id:'home',comparison:'capture/comparison.json'}]});
  fs.mkdirSync(path.join(root,'run'));fs.mkdirSync(path.join(root,'docs/factory/project'),{recursive:true});
  const common={ROOT:root,SNAPSHOT:path.join(root,'snapshot'),read:f=>JSON.parse(fs.readFileSync(f)),write,inside,hash,fingerprint:()=>implementation};
  const fakeRequire=id=>id==='./common'?common:id==='./visual'?{sourceHash:()=> 'source'}:id==='./source-geometry'?{resolveManifest:()=>manifest}:require(id);
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'audit-progress.js'),'utf8'),{require:fakeRequire,module,__dirname:root,console:{log(){}}});
  const api=module.exports,run=path.join(root,'run');
  const ledger=api.initialize(run,'capture/summary.json',0);
  const packet=api.packet(ledger,'route-home');assert.equal(packet.pending.length,3);
  const input='item.json';write(path.join(root,input),{status:'needs_work',summary:'measured gap',issues:['gap differs'],evidence:['capture/comparison.json','probe.json']});
  api.saveItem(ledger,'route-home','section:body',input);
  // Simulate interruption and reconstruction from disk: one saved item stays done.
  assert.equal(api.initialize(run,'capture/summary.json',0),ledger);
  assert.deepEqual(Array.from(api.packet(ledger,'route-home').pending,i=>i.id),['responsive','interactions']);
  assert.throws(()=>api.aggregate(ledger),/INCOMPLETE/);
  assert.throws(()=>api.saveItem(ledger,'route-home','section:body',input),/ALREADY_RECORDED/);
  assert.throws(()=>api.saveItem(ledger,'route-home','unknown',input),/UNKNOWN/);
  assert.equal(api.resumeComparison(run).file,'capture/summary.json');
  text(path.join(root,'probe.json'),'changed');assert.equal(api.packet(ledger,'route-home').pending.length,3);
  api.saveItem(ledger,'route-home','section:body',input); // invalidated evidence requires re-audit, history retained
  for(const unit of api.status(ledger)) for(const item of unit.pending) {
    write(path.join(root,input),{status:'blocked',summary:'missing real input',issues:['requires source'],evidence:['capture/comparison.json']});
    api.saveItem(ledger,unit.id,item,input);
  }
  assert.equal(api.aggregate(ledger).status,'needs_work');
  implementation='two';assert.equal(api.resumeComparison(run),null);assert.throws(()=>api.status(ledger),/INPUT_CHANGED/);
  implementation='one';text(path.join(root,'capture/rendered.png'),'tampered');assert.equal(api.resumeComparison(run),null);
  console.log('PASS: interrupted resume, pending-only scope, immutable completion, evidence invalidation, blocked coverage, aggregate guard, implementation/capture invalidation');
} finally {
  const relative=path.relative(os.tmpdir(),root);
  if(!relative.startsWith('factory-audit-test-')||relative.includes(path.sep))throw Error('Unsafe test cleanup');
  fs.rmSync(root,{recursive:true,force:true});
}
