/** Read-only local link and accessibility evidence, no remote requests/import. */
const fs=require('fs'),path=require('path');
const {getChromium,discoverBrowser}=require('../../../factory/qa/browser');
const cache=path.resolve(__dirname,'../../../../.factory-cache/live/collegium-balticum/migration');
(async()=>{
 const pages=JSON.parse(fs.readFileSync(path.join(cache,'source.json'))).pages;
 const browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,args:['--no-sandbox']});
 const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 const rows=[],local=new Set(['http://localhost:8000/?s=dietetyka','http://localhost:8000/category/wpisy/blog-post/page/2/']);
 for(const p of pages){await page.goto('http://localhost:8000'+p.path,{waitUntil:'domcontentloaded'});const data=await page.evaluate(()=>({links:[...document.querySelectorAll('main a[href],header a[href],footer a[href]')].map(a=>({url:a.href,name:a.getAttribute('aria-label')||a.textContent.trim(),target:a.target})),tables:[...document.querySelectorAll('.cb-table-wrap')].map(n=>({scrollable:n.scrollWidth>n.clientWidth+1,tabindex:n.getAttribute('tabindex')})),blankInformativeCandidates:[...document.querySelectorAll('main img[alt=""]')].map(n=>({src:n.src,linked:!!n.closest('a'),classes:n.className}))}));for(const a of data.links)if(new URL(a.url).origin==='http://localhost:8000'){const u=new URL(a.url);u.hash='';local.add(u.href)}rows.push({id:p.id,...data});}
 const checks=[];for(const url of local){const r=await page.request.get(url,{timeout:20000});checks.push({url,status:r.status(),finalUrl:r.url()})}
 await browser.close();const report={at:new Date().toISOString(),rows,localChecks:checks};fs.writeFileSync(path.join(cache,process.env.CB_AUDIT_DIR||'task4e','functional.json'),JSON.stringify(report,null,2));console.log('local links',checks.length,'failures',checks.filter(x=>x.status!==200).length);if(checks.some(x=>x.status!==200))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
