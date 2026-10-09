const fs=require('fs'),path=require('path');
const {unzip,verify,sha}=require('../../../../tools/live-capture/bundle');
const config=require('../../../../docs/projects/collegium-balticum/live.json');
function importBundle(input,{githubArtifact,source=config,importRoot}={}){
  const root=path.resolve(importRoot||'.factory-cache/live/collegium-balticum/imports');fs.mkdirSync(root,{recursive:true});const staging=fs.mkdtempSync(path.join(root,'.verify-'));
  try{unzip(input,staging);const manifest=verify(staging,source);
    if(githubArtifact){if(manifest.runner?.kind!=='github-actions'||manifest.runner.repository!=='marcinpracavp/mwstudios-wordpress-factory'||String(manifest.runner.runId)!==String(githubArtifact.workflow_run.id)||manifest.runner.commit!==githubArtifact.workflow_run.head_sha)throw Error('GITHUB_PROVENANCE_MISMATCH');}
    for(const record of manifest.records.filter(r=>r.status==='DONE')){const html=fs.readFileSync(path.join(staging,record.paths.html),'utf8');if(!/collegium balticum/i.test(html))throw Error('WRONG_CB_HTML');}
    const id=sha(fs.readFileSync(path.join(staging,'manifest.json'))).slice(0,16);const destination=path.join(root,id);if(fs.existsSync(destination)){verify(destination,source);fs.rmSync(staging,{recursive:true,force:true});return destination;}
    fs.renameSync(staging,destination);
    const mapping={importedAt:new Date().toISOString(),bundleId:id,sourceUrl:source.sourceUrl,githubArtifactId:githubArtifact?.id||null,manifestHash:sha(fs.readFileSync(path.join(destination,'manifest.json'))),rows:source.routes.map(route=>{const records=manifest.records.filter(r=>r.id===route.id);return {id:route.id,productionUrl:source.sourceUrl+route.path,SOURCE_CAPTURE:records.length===2&&records.every(r=>r.status==='DONE')?'DONE':records.some(r=>r.status==='BLOCKED')?'BLOCKED':'NOT_STARTED',VISUAL_QA:'NOT_STARTED',CONTENT:'NOT_STARTED',references:records.map(r=>({...r,absolutePaths:Object.fromEntries(Object.entries(r.paths).map(([k,v])=>[k,path.join(destination,v)]))}))};})};
    // Keep the hash-checked bundle unchanged; mapping lives next to it.
    fs.writeFileSync(path.join(root,id+'.import.json'),JSON.stringify(mapping,null,2)+'\n');
    const imports=fs.readdirSync(root).filter(name=>name.endsWith('.import.json')).map(name=>JSON.parse(fs.readFileSync(path.join(root,name)))).sort((a,b)=>a.importedAt.localeCompare(b.importedAt));
    const index={updatedAt:new Date().toISOString(),sourceUrl:source.sourceUrl,rows:source.routes.map(route=>{const history=imports.flatMap(bundle=>bundle.rows.filter(row=>row.id===route.id).flatMap(row=>row.references.map(reference=>({...reference,bundleId:bundle.bundleId,importedAt:bundle.importedAt}))));const current=['desktop','mobile'].map(viewport=>history.filter(r=>r.viewport===viewport&&r.status==='DONE').at(-1)).filter(Boolean);return {id:route.id,SOURCE_CAPTURE:current.length===2?'DONE':history.some(r=>r.status==='BLOCKED')?'BLOCKED':'NOT_STARTED',VISUAL_QA:'NOT_STARTED',CONTENT:'NOT_STARTED',current,history};})};
    fs.writeFileSync(path.join(root,'references-index.json'),JSON.stringify(index,null,2)+'\n');console.log(destination);return destination;
  }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error;}
}
if(require.main===module){if(process.argv.length!==3)throw Error('Usage: import.js capture.zip');importBundle(path.resolve(process.argv[2]));}
module.exports={importBundle};
