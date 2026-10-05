const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'../../..');
const extensions=new Set(['.js','.json','.md','.php','.scss','.css','.yml','.yaml']);
function files(directory,result=[]){
  if(!fs.existsSync(directory))return result;
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const target=path.join(directory,entry.name);
    if(entry.isDirectory())files(target,result);
    else if(extensions.has(path.extname(entry.name))&&!entry.name.endsWith('.test.js'))result.push(target);
  }
  return result;
}

test('clean Autopilot contains no previous-project identity or evidence',()=>{
  const targets=['factory','scripts/factory','docs/factory'].flatMap(folder=>files(path.join(root,folder)));
  const forbidden=[/emko/i,/rudnik/i,/rudnikagro/i];
  const leaks=[];
  for(const file of targets){
    const source=fs.readFileSync(file,'utf8');
    for(const pattern of forbidden)if(pattern.test(source))leaks.push(path.relative(root,file));
  }
  assert.deepEqual([...new Set(leaks)],[]);
  assert.deepEqual(fs.readdirSync(path.join(root,'docs/factory/project')).sort(),['README.md']);
  const project=JSON.parse(fs.readFileSync(path.join(root,'factory/project.json')));
  assert.equal(project.mode,'boilerplate');
  assert.equal(project.environment.localUrl,null);
  assert.equal(project.figma.url,null);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'scripts/factory/project/component-registry.json'))),[]);
});

test('Autopilot code does not write generated reports into tracked project docs',()=>{
  const source=files(path.join(root,'scripts/factory')).map(file=>fs.readFileSync(file,'utf8')).join('\n');
  assert.doesNotMatch(source,/docs[\\/]factory[\\/]project[\\/](?:PLAN|STATUS|FINAL|QA_REPORT|REUSABLE|SOURCE_)/);
});

test('host freezes architecture before foundation and uses full-page route gates',()=>{
  const source=fs.readFileSync(path.join(root,'scripts/factory/autopilot/run.js'),'utf8');
  assert.ok(source.indexOf("const routeBlueprint=require('./route-blueprint').create") < source.indexOf("await work('foundation', { id: 'global-layout'"));
  assert.match(source,/\['route-build', 'state-build'\]\.includes\(task\.mode\)/);
  assert.match(source,/fullPageTask[\s\S]+check => check\.pagePassed === true/);
});
