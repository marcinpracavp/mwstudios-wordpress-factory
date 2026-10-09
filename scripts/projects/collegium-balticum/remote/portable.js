const fs=require('fs'),path=require('path'),os=require('os');
const {zip}=require('../../../../tools/live-capture/bundle');
const root=path.resolve(__dirname,'../../../..');
function build(output=path.join(root,'.factory-cache/live/collegium-balticum/cb-capture-kit.zip')){
  const staging=fs.mkdtempSync(path.join(os.tmpdir(),'cb-capture-kit-'));
  try{for(const name of ['scripts/factory','scripts/projects/collegium-balticum/remote','tools/live-capture/bundle.js','docs/projects/collegium-balticum/live.json','factory/schemas/live.schema.json']){fs.mkdirSync(path.dirname(path.join(staging,name)),{recursive:true});fs.cpSync(path.join(root,name),path.join(staging,name),{recursive:true});}
    const pkg=JSON.parse(fs.readFileSync(path.join(root,'tools/live-capture/package.json')));fs.writeFileSync(path.join(staging,'package.json'),JSON.stringify(pkg,null,2));fs.copyFileSync(path.join(root,'tools/live-capture/package-lock.json'),path.join(staging,'package-lock.json'));
    fs.writeFileSync(path.join(staging,'capture.cjs'),`const {spawnSync}=require('child_process'); const fs=require('fs'),path=require('path'); process.chdir(__dirname); const exec=(command,args)=>{const r=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'&&command.endsWith('npm.cmd')});if(r.status!==0)process.exit(r.status||1);}; if(!fs.existsSync('node_modules/playwright-core'))exec(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts','--no-audit','--no-fund']);const found=require('./scripts/factory/qa/browser').discoverBrowser().browser;if(found){process.env.FACTORY_BROWSER_PATH=found.executablePath;}else{exec(process.execPath,['node_modules/playwright-core/cli.js','install','chromium']);process.env.FACTORY_BROWSER_PATH=require('playwright-core').chromium.executablePath();}exec(process.execPath,['scripts/projects/collegium-balticum/remote/run.js','--mode','full','--output','references-'+Date.now()]);\n`);
    fs.writeFileSync(path.join(staging,'README.txt'),'Requires Node.js 22+. Unzip and run: node capture.cjs\nInstalls only Playwright-core and Ajv, requires no WordPress/Docker.\nDownloads Chromium. Linux may need its usual Chromium system libraries.\nChecks home first; full batch is stopped if it fails.\nOutput: references-<time>.zip. Import with the project remote/import.js.\nNo CAPTCHA bypass or disabled TLS.\n');
    fs.mkdirSync(path.dirname(output),{recursive:true});zip(staging,output);console.log(output);return output;
  }finally{fs.rmSync(staging,{recursive:true,force:true});}
}
if(require.main===module)build();module.exports={build};
