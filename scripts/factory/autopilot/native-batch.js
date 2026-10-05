const fs=require('fs'),path=require('path');
const {ROOT,write}=require('./common');
async function verify(task,output){
  const hook=path.join(ROOT,'scripts/factory/project/native-batch.js');
  if(!fs.existsSync(hook))return {passed:false,errors:['NATIVE_BATCH_PROBE_REQUIRED']};
  const adapter=require('./visual').loadProjectHooks(hook);
  if(typeof adapter.verifyBatch!=='function')return {passed:false,errors:['NATIVE_BATCH_VERIFY_INTERFACE_REQUIRED']};
  const startedAt=new Date().toISOString();
  let result;
  try{result=await adapter.verifyBatch({kind:task.class,records:task.contentRecords,keys:task.contentKeys,readOnly:true});}
  catch(error){
    const proof={passed:false,task:task.id,kind:task.class,startedAt,finishedAt:new Date().toISOString(),records:[],errors:[`NATIVE_PROBE_FAILED: ${error.message}`]};
    write(output,proof);return proof;
  }
  const rows=result?.records||[],errors=[];
  for(const key of task.contentKeys){
    const matches=rows.filter(r=>r.key===key);
    if(matches.length!==1 || matches[0].passed!==true || !matches[0].observed || typeof matches[0].observed!=='object')errors.push(`NATIVE_RECORD_UNVERIFIED: ${key}`);
  }
  if(rows.some(r=>!task.contentKeys.includes(r.key)))errors.push('NATIVE_PROBE_SCOPE_ESCAPED');
  if(result?.readOnly!==true)errors.push('NATIVE_PROBE_READ_ONLY_REQUIRED');
  const proof={passed:errors.length===0,task:task.id,kind:task.class,startedAt,finishedAt:new Date().toISOString(),records:rows,errors};
  write(output,proof);return proof;
}
module.exports={verify};
