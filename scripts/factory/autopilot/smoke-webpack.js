// Isolated fixture build/re-capture. No WordPress writes and no model calls.
const fs=require('fs'),path=require('path'),http=require('http');
const engineRoot=path.resolve(__dirname,'../../..');
function build(root){
  const allowed=path.join(engineRoot,'.factory-cache/v2-smoke')+path.sep;
  if(!path.resolve(root).startsWith(allowed))throw Error('SMOKE_ROOT_REQUIRED');
  fs.writeFileSync(path.join(root,'src/entry.js'),"import css from './layout.css';const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);");
  fs.writeFileSync(path.join(root,'webpack.config.js'),"const path=require('path');module.exports={mode:'production',entry:'./src/entry.js',output:{path:path.resolve(__dirname,'dist'),filename:'layout.js'},module:{rules:[{test:/\\.css$/,type:'asset/source'}]}};");
  const result=require('child_process').spawnSync(process.execPath,[path.join(engineRoot,'node_modules/webpack-cli/bin/cli.js'),'--config','webpack.config.js'],{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000});
  fs.writeFileSync(path.join(root,'webpack-build.log'),(result.stdout||'')+(result.stderr||''));
  if(result.status!==0)throw Error('SMOKE_WEBPACK_FAILED');
}
async function verify(root){
  root=path.resolve(root);build(root);
  const server=http.createServer((req,res)=>{
    if(req.url==='/layout.js'){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(path.join(root,'dist/layout.js')));return;}
    res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><link rel="icon" href="data:,"><script src="/layout.js"></script></head><body><header data-factory-section="shared-header">Shared test header</header><main data-factory-section="hero"><h1 style="margin:0">Synthetic smoke fixture</h1><button onclick="document.body.classList.toggle('open')">Open</button><div class="panel">Source active content</div></main><footer data-factory-section="shared-footer">Shared test footer</footer>${req.url==='/active'?'<script>document.body.classList.add("open")</script>':''}</body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const {discoverBrowser,getChromium}=require('../qa/browser');
  const browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1920,height:900},deviceScaleFactor:1}),checks=[];
    for(const route of ['home','about','active']){
      await page.goto(`http://127.0.0.1:${server.address().port}/${route==='home'?'':route}`);await require('./visual').settle(page);
      const rendered=path.join(root,route+'-webpack.png');await page.screenshot({path:rendered,fullPage:true});
      const pixels=await require('./component-visual').compare(page,path.join(root,'.factory-cache/figma/latest',route+'.png'),rendered,{x:0,y:0,width:1920,height:900},24);
      const metrics=await require('./visual').metrics(page);checks.push({route,ratio:pixels.ratio,overflow:metrics.overflow});
    }
    const result={passed:checks.every(c=>c.ratio===0&&c.overflow===0),checks,builtBy:'webpack production; rendered CSS injected from emitted bundle'};
    fs.writeFileSync(path.join(root,'webpack-validation.json'),JSON.stringify(result,null,2));if(!result.passed)throw Error('SMOKE_WEBPACK_PIXELS_FAILED');return result;
  }finally{await browser.close();server.close();}
}
module.exports={build,verify};
if(require.main===module)verify(process.argv[2]).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
