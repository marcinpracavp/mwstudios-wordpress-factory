const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
test('native resume verifies every assigned record against a fresh read-only adapter',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'factory-native-test-'));
  process.env.FACTORY_AUTOPILOT_ROOT=root;
  const {write}=require('./common'),{verify}=require('./native-batch');
  const hook=path.join(root,'scripts/factory/project/native-batch.js');
  const task={id:'three-products',class:'product-import',contentKeys:['pl:n1:card','pl:n2:card'],contentRecords:[]};
  try{
    assert.equal((await verify(task,path.join(root,'proof.json'))).passed,false);
    fs.mkdirSync(path.dirname(hook),{recursive:true});
    fs.writeFileSync(hook,"exports.verifyBatch=async({keys})=>({readOnly:true,records:keys.map(key=>({key,passed:true,observed:{nativeId:key}}))})");
    assert.equal((await verify(task,path.join(root,'proof.json'))).passed,true);
    fs.writeFileSync(hook,"exports.verifyBatch=async()=>({readOnly:true,records:[]})");
    assert.equal((await verify(task,path.join(root,'proof.json'))).passed,false,'Changed/removed runtime data cannot reuse old PASS');
    fs.writeFileSync(hook,"exports.verifyBatch=async({keys})=>({readOnly:false,records:keys.map(key=>({key,passed:true,observed:{nativeId:key}}))})");
    assert.equal((await verify(task,path.join(root,'proof.json'))).passed,false);
  }finally{if(path.dirname(root)===os.tmpdir()&&path.basename(root).startsWith('factory-native-test-'))fs.rmSync(root,{recursive:true});}
});
