// Durable audit coverage. Completion is a verified record, never conversation history.
const fs = require('fs');
const path = require('path');
const {ROOT, SNAPSHOT, read, write, inside, hash, fingerprint} = require('./common');
const rel = file => path.relative(ROOT,file).replaceAll('\\','/');
const digest = file => hash(fs.readFileSync(file));
const VERSION = 1;
function binding() {
  return {version:VERSION,implementationHash:fingerprint(),sourceHash:require('./visual').sourceHash(),
    thresholds:read(path.join(ROOT,'factory/autopilot.json')).visual,
    geometryHash:hash(JSON.stringify(require('./source-geometry').resolveManifest())),
    measurementCode:hash(['visual.js','visual-ownership.js','template-evidence.js','audit-progress.js'].map(f=>digest(path.join(__dirname,f))).join(':'))};
}
function same(a,b) { return JSON.stringify(a)===JSON.stringify(b); }
function evidence(files) {
  if (!Array.isArray(files) || !files.length) throw Error('AUDIT_EVIDENCE_REQUIRED');
  return [...new Set(files)].map(file=>{
    const target=inside(ROOT,file);
    if(!fs.statSync(target).isFile()) throw Error('AUDIT_EVIDENCE_NOT_FILE');
    return {path:rel(target),sha256:digest(target)};
  });
}
function intact(entries) { return entries.every(e=>{try{return digest(inside(ROOT,e.path))===e.sha256;}catch{return false;}}); }
function ledger(file) {
  const value=read(inside(ROOT,file));
  if(!same(value.binding,binding())) throw Error('AUDIT_INPUT_CHANGED');
  if(!intact(value.inputs)) throw Error('AUDIT_COMPARISON_CHANGED');
  return value;
}
function inputFiles(summaryFile) {
  const summary=read(summaryFile), inputs=[rel(summaryFile)];
  for(const route of summary.routes) {
    inputs.push(route.comparison);
    const file=inside(ROOT,route.comparison), comparison=read(file);
    inputs.push(comparison.rendered.path,rel(inside(SNAPSHOT,comparison.reference.path)));
    for(const item of comparison.responsive || []) if(item.screenshot) inputs.push(item.screenshot);
    // Hash all retained local PNGs, including section crops and raw diff.
    for(const name of fs.readdirSync(path.dirname(file))) if(name.endsWith('.png')) inputs.push(rel(path.join(path.dirname(file),name)));
  }
  return evidence(inputs);
}
function resumeComparison(runDir) {
  const pointer=path.join(runDir,'audit-progress','current.json');
  if(!fs.existsSync(pointer)) return null;
  try { const state=ledger(read(pointer).ledger); return {file:state.comparison,value:read(inside(ROOT,state.comparison))}; }
  catch(e) { if(['AUDIT_INPUT_CHANGED','AUDIT_COMPARISON_CHANGED'].includes(e.message)) return null; throw e; }
}
function initialize(runDir,comparisonFile,round) {
  const root=path.join(runDir,'audit-progress'), current=path.join(root,'current.json');
  const bound=binding(), key=hash(JSON.stringify(bound)).slice(0,20), file=path.join(root,key,'ledger.json');
  if(fs.existsSync(file)) { ledger(rel(file)); write(current,{ledger:rel(file)}); return rel(file); }
  const summary=read(inside(ROOT,comparisonFile));
  if(summary.implementationHash!==bound.implementationHash || summary.sourceHash!==bound.sourceHash || !same(summary.thresholds,bound.thresholds)) throw Error('AUDIT_CAPTURE_STALE');
  const manifest=require('./source-geometry').resolveManifest(), units=[], shared=[], sharedKeys=new Set();
  for(const route of [...summary.routes].sort((a,b)=>Number(!!manifest.routes.find(r=>r.id===a.id)?.state)-Number(!!manifest.routes.find(r=>r.id===b.id)?.state))) {
    const comparison=read(inside(ROOT,route.comparison)), items=[];
    for(const g of comparison.geometry || []) {
      const crop=(comparison.pixels?.crops || []).find(c=>c.id===g.id);
      const item={id:`section:${g.id}`,kind:'visual',section:g.id,route:route.id,comparison:route.comparison,owner:g.owner};
      if(g.owner==='header'||g.owner==='footer'||g.owner==='shared') {
        const ref=path.join(path.dirname(inside(ROOT,route.comparison)),`${g.id}-reference.png`);
        const sourceKey=hash(JSON.stringify([g.id,g.expected?.width,g.expected?.height,fs.existsSync(ref)?digest(ref):null]));
        if(!sharedKeys.has(sourceKey)) {sharedKeys.add(sourceKey);shared.push({...item,id:`shared:${sourceKey.slice(0,16)}`});}
      } else if(g.owner==='page' && !g.reused) items.push(item);
    }
    items.push({id:'responsive',kind:'responsive',route:route.id,comparison:route.comparison},
      {id:'interactions',kind:'interactions',route:route.id,comparison:route.comparison});
    units.push({id:`route-${route.id}`,routes:[route.id],items});
  }
  if(shared.length) units.unshift({id:'shared-components',routes:[...new Set(shared.map(i=>i.route))],items:shared});
  units.push({id:'native-integrations',routes:manifest.routes.map(r=>r.id),items:[
    {id:'commerce',kind:'native',description:'Source products, prices/variations, taxonomy, source reviews and native relations.'},
    {id:'editable-content',kind:'native',description:'ACF content and replaceable SVG fields; required plugin integrations and retained external dependencies.'}
  ]});
  // Preserve old partial findings as candidates, never certify them from file existence.
  const legacy=[];
  for(const entry of fs.readdirSync(runDir,{withFileTypes:true})) if(entry.isDirectory() && /^\d+-audit-/.test(entry.name)) {
    for(const name of fs.readdirSync(path.join(runDir,entry.name))) if(/audit.*\.json$|probe.*\.json$/i.test(name)) legacy.push(rel(path.join(runDir,entry.name,name)));
  }
  write(file,{version:VERSION,key,round,binding:bound,comparison:comparisonFile,inputs:inputFiles(inside(ROOT,comparisonFile)),units,legacyEvidence:legacy,createdAt:new Date().toISOString()});
  write(current,{ledger:rel(file)});
  return rel(file);
}
function checkpointPath(file,unit,item) {return path.join(path.dirname(inside(ROOT,file)),'items',hash(`${unit}:${item}`)+'.json');}
function records(file,state,unit) {
  return unit.items.map(item=>{
    const recordFile=checkpointPath(file,unit.id,item.id);
    if(!fs.existsSync(recordFile)) return {item};
    const record=read(recordFile);
    if(record.key!==state.key || record.unit!==unit.id || record.item!==item.id || !intact(record.evidence)) return {item,invalidated:true};
    return {item,record,file:rel(recordFile)};
  });
}
function saveItem(file,unitId,itemId,inputFile) {
  const state=ledger(file),unit=state.units.find(u=>u.id===unitId),item=unit?.items.find(i=>i.id===itemId);
  if(!item) throw Error('AUDIT_ITEM_UNKNOWN');
  const input=read(inside(ROOT,inputFile));
  if(!['passed','needs_work','blocked'].includes(input.status) || typeof input.summary!=='string' || !input.summary.trim()
    || !Array.isArray(input.issues) || input.issues.some(i=>typeof i!=='string')
    || (input.status==='passed' && input.issues.length) || (input.status!=='passed' && !input.issues.length)) throw Error('AUDIT_RECORD_INVALID');
  const refs=evidence(input.evidence);
  if(item.comparison && !refs.some(e=>e.path===item.comparison)) throw Error('AUDIT_ITEM_COMPARISON_REQUIRED');
  // Read the binding again before atomic commit, catching concurrent implementation edits.
  ledger(file);
  const target=checkpointPath(file,unitId,itemId);
  const record={key:state.key,unit:unitId,item:itemId,status:input.status,summary:input.summary,issues:input.issues,evidence:refs,completedAt:new Date().toISOString()};
  if(fs.existsSync(target)) {
    const previous=read(target);
    if(intact(previous.evidence)) throw Error('AUDIT_ITEM_ALREADY_RECORDED');
    write(`${target}.invalidated-${Date.now()}.json`,previous);
  }
  write(target,record);
  console.log(`AUDIT CHECKPOINT ${unitId}/${itemId}: ${input.status}`);
}
function packet(file,unitId) {
  const state=ledger(file),unit=state.units.find(u=>u.id===unitId);
  if(!unit) throw Error('AUDIT_UNIT_UNKNOWN');
  const all=records(file,state,unit),pending=all.filter(r=>!r.record).map(r=>r.item);
  const routes=[...new Set(pending.map(i=>i.route).filter(Boolean))];
  const output=path.join(path.dirname(inside(ROOT,file)),`packet-${unitId}.json`);
  // Show only the newest candidate of each report type; older originals remain on disk.
  const latestCandidates=new Map();
  for(const entry of state.legacyEvidence) latestCandidates.set(path.basename(entry),entry);
  write(output,{ledger:file,key:state.key,unit:unitId,routes:routes.length?routes:unit.routes,pending,
    completed:all.filter(r=>r.record).map(r=>({item:r.item.id,status:r.record.status,checkpoint:r.file})),
    legacyEvidence:[...latestCandidates.values()],
    checkpointCommand:`node scripts/factory/autopilot/audit-progress.js record ${file} ${unitId} <item-id> <input-json>`,
    recordSchema:{status:'passed|needs_work|blocked',summary:'What was actually checked',issues:['Concrete finding or untestable limitation'],evidence:['Existing theme-relative FILE paths; include the assigned comparison for route checks']},
    instruction:'Check ONLY pending items. Save an atomic checkpoint immediately after each item, before starting the next. Existing completed items must not be reread or repeated. Earlier partial evidence is a candidate: inspect only relevant records and verify applicability; never assume old PASS. Missing genuine inputs are recorded blocked with evidence, then continue other items.'});
  return {file:rel(output),pending,unit:{...unit,routes:routes.length?routes:unit.routes},key:state.key};
}
function status(file) {
  const state=ledger(file);
  return state.units.map(unit=>{const rows=records(file,state,unit);return {id:unit.id,total:rows.length,completed:rows.filter(r=>r.record).length,pending:rows.filter(r=>!r.record).map(r=>r.item.id)};});
}
function aggregate(file) {
  const state=ledger(file),rows=state.units.flatMap(u=>records(file,state,u));
  if(rows.some(r=>!r.record)) throw Error('AUDIT_COVERAGE_INCOMPLETE');
  const issues=rows.flatMap(r=>r.record.issues.map(i=>`${r.record.unit}/${r.record.item}: ${i}`));
  const result={status:issues.length?'needs_work':'passed',summary:`Independent audit: ${rows.length} durable checkpoints; ${issues.length} unresolved findings.`,issues,evidence:rows.map(r=>r.file)};
  const report=['# Independent visual audit',`Input snapshot: ${state.comparison}`,`Implementation: ${state.binding.implementationHash}`,
    'Completed coverage does not imply visual PASS. Blocked items retain unresolved source/runtime limitations.',
    ...rows.map(r=>`\n## ${r.record.unit} / ${r.record.item}\n${r.record.status}: ${r.record.summary}\n${r.record.issues.map(i=>'- '+i).join('\n')}\nEvidence: ${r.record.evidence.map(e=>e.path).join(', ')}`)].join('\n');
  fs.writeFileSync(path.join(ROOT,'docs/factory/project/FINAL_VISUAL_AUDIT.md'),report+'\n');
  fs.writeFileSync(path.join(ROOT,'docs/factory/project/FINAL_REPORT.md'),report+'\n');
  write(path.join(path.dirname(inside(ROOT,file)),'result.json'),result);
  return result;
}
module.exports={initialize,resumeComparison,packet,status,aggregate,saveItem};
if(require.main===module) {
  try { const [command,...args]=process.argv.slice(2);
    if(command==='record')saveItem(...args);else if(command==='status')console.log(JSON.stringify(status(...args)));else throw Error('Usage: audit-progress.js record <ledger> <unit> <item> <input-json> | status <ledger>');
  } catch(e){console.error(e.message);process.exitCode=1;}
}
