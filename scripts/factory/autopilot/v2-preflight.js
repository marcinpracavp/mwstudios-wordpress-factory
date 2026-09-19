// Prepare real task capsules without starting a model or changing the site.
const fs = require('fs');
const path = require('path');
const { ROOT, CACHE, read, write } = require('./common');
function check() {
  const config = read(path.join(ROOT, 'factory/autopilot.json'));
  require('./model-router').validateRouter(config);
  const gate = require('./gates').snapshot();
  if (!gate.passed) throw Error(`SOURCE_NOT_READY: ${gate.errors.slice(0,5).join('; ')}`);
  const manifest = require('./source-geometry').resolveManifest();
  const registry=path.join(ROOT,'scripts/factory/project/component-registry.json');
  const plan = require('./component-plan').plan(manifest, require('./state-plan').load(manifest),fs.existsSync(registry)?read(registry):[]);
  const output = path.join(CACHE, `v2-preflight-${Date.now()}`), errors = [], rows = [];
  const tasks = [...plan.shared.map(task=>({stage:'foundation',task})),...plan.pages.map(task=>({stage:'build',task}))];
  for (let i=0;i<tasks.length;i++) {
    const {stage,task}=tasks[i], dir=path.join(output,String(i).padStart(3,'0'));
    try {
      const routing=require('./model-router').routeTask(config,task);
      const sourceContext=require('./source-context').prepareContext(stage,task,dir);
      const capsule=require('./task-capsule').create({stage,task,routing,dir,sourceContext,instructions:require('./custom-instructions').load(ROOT)});
      const bytes=fs.statSync(path.join(dir,'task-capsule.json')).size+Buffer.byteLength(require('./prompts').prompt(stage,task,output));
      if(bytes>routing.budget.maxPromptBytes)throw Error(`TASK_INPUT_PREFLIGHT_BUDGET: ${bytes}`);
      rows.push({task:task.id,bytes,files:capsule.filesToChange.length,model:routing.alias,viewport:capsule.routes.map(r=>r.viewport.width)});
    } catch(e) { errors.push({task:task.id,error:e.message}); }
  }
  const result={passed:!errors.length,shared:plan.shared.length,pageComponents:plan.pages.length,prepared:rows.length,maxBytes:Math.max(0,...rows.map(r=>r.bytes)),errors,rows};
  write(path.join(output,'REPORT.json'),result);
  console.log(JSON.stringify({...result,rows:undefined,report:path.relative(ROOT,path.join(output,'REPORT.json')).replaceAll('\\','/')},null,2));
  return result;
}
module.exports={check};
if(require.main===module){try{if(!check().passed)process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}}
