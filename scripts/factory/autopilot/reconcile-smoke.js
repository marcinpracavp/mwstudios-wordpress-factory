// Recover the completed live smoke audit without a second paid model invocation.
const fs=require('fs'),path=require('path');
const {read,write,inside}=require('./common');
async function reconcile(root){
  root=path.resolve(root);
  const allowed=path.resolve(__dirname,'../../../.factory-cache/v2-smoke')+path.sep;
  if(!root.startsWith(allowed))throw Error('SMOKE_ROOT_REQUIRED');
  const expected='html,body{margin:0;font-family:Arial}header{height:64px;background:#123;color:white}main{height:320px;background:#eef}footer{height:40px;background:#abc}button{height:32px}.panel{display:none;height:80px}.open .panel{display:block}';
  if(fs.readFileSync(path.join(root,'src/layout.css'),'utf8').trimEnd()!==expected)throw Error('SMOKE_SOURCE_CHANGED');
  const attempt=path.join(root,'run/002-final-sol'),execution=read(path.join(attempt,'execution.json')),result=read(path.join(attempt,'result.json'));
  const valid=new (require('ajv'))().compile(read(path.join(root,'factory/schemas/autopilot-result.schema.json')));
  if(!execution.completed||execution.failure?.message!=='TASK_REPORTED_TOKEN_BUDGET'||!valid(result)||result.status!=='passed'||!result.evidence.every(f=>fs.existsSync(inside(root,f))))throw Error('SMOKE_REVIEW_NOT_RECOVERABLE');
  const packet=read(path.join(root,'final-review-packet.json'));
  const summary=checks=>({passed:checks.every(c=>c.ratio===0&&c.overflow===0),sourceHash:'synthetic-three-view-v1',routes:checks.map(c=>({id:c.route,ownership:{page:{pixels:1920*900,ratio:c.ratio}}}))});
  let webpack;
  await require('./final-audit').run({dir:path.join(root,'run'),comparison:summary(packet.checks),
    invoke:async()=>{throw Error('NO_SECOND_SOL_ALLOWED');},reconcile:async()=>result,
    repair:async()=>{throw Error('SMOKE_UNEXPECTED_REPAIR');},build:async()=>require('./smoke-webpack').build(root),
    capture:async()=>{webpack=await require('./smoke-webpack').verify(root);return summary(webpack.checks);}});
  const config=read(path.join(root,'factory/autopilot.json')),luna=read(path.join(root,'worker-result.json'));
  for(const [alias,dir,usage,status] of [['luna',path.join(root,'run/001-hero-height'),luna.usage,'pass'],['sol',attempt,execution.usage,'pass-with-budget-overrun']]){
    require('./telemetry').record(path.join(root,'run'),{task:alias==='luna'?'hero-height':'final-sol-once',routing:{alias,model:`gpt-5.6-${alias}`,reasoningEffort:alias==='luna'?'medium':'high'},usage,status,dir,pricing:config.pricing});
  }
  const report={status:'complete',readiness:'READY FOR HUMAN REVIEW',fixture:'synthetic only; not RudnikAgro acceptance',model:'luna',finalModel:'sol',
    finalInvocations:1,checks:webpack.checks,webpack,customInstructionObserved:fs.readFileSync(path.join(root,'proof.md'),'utf8').includes('CUSTOM_SMOKE_OBSERVED'),
    negativeControlRatio:packet.negativeControlRatio,usage:luna.usage,finalUsage:execution.usage,budgetOverrun:true,
    recovery:'Completed Sol result retained; exact fixture CSS validated and fresh webpack/browser comparison passed; no second model call',
    tokenReductionProven:false,limitation:'Prompt reduction is verified separately; no paid A/B baseline. Sol exceeded the smoke budget; overrun retained in execution/telemetry.'};
  write(path.join(root,'REPORT.json'),report);return report;
}
module.exports={reconcile};
if(require.main===module)reconcile(process.argv[2]).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
