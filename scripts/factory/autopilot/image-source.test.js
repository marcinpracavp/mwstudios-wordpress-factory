const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
test('image exemptions require exact section/node/source bytes, not another cached product image',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'factory-image-source-'));process.env.FACTORY_AUTOPILOT_ROOT=root;
  const {write,SNAPSHOT}=require('./common');
  try{
    fs.mkdirSync(path.join(SNAPSHOT,'assets'),{recursive:true});fs.writeFileSync(path.join(SNAPSHOT,'assets/a.png'),'source-a');fs.writeFileSync(path.join(SNAPSHOT,'assets/b.png'),'source-b');
    write(path.join(SNAPSHOT,'content-map.json'),{fields:[{section:'list',nodeId:'card-a',value:{media:{sourceNodeId:'image-a',path:'assets/a.png'}}},{section:'list',nodeId:'image-b',value:'assets/b.png'}]});
    const page={request:{get:async()=>({ok:()=>true,body:async()=>Buffer.from('source-a')})}};
    const im={src:'http://fixture.invalid/a.png',section:'list',sourceNodeId:'image-a',loaded:true,width:100,height:100};
    const images=[im,{...im,sourceNodeId:'image-b'},{...im,section:'other'},{...im,sourceNodeId:null}];
    await require('./image-noise').verifySources(page,images,'http://fixture.invalid');
    assert.deepEqual(images.map(i=>i.sourceIdentityVerified),[true,false,false,false]);
  }finally{if(path.dirname(root)===os.tmpdir()&&path.basename(root).startsWith('factory-image-source-'))fs.rmSync(root,{recursive:true});}
});
