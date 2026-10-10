/** Verify real originals, all local links and keyboard lightbox in both viewports. */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const {sha,verify}=require('../../../../tools/live-capture/bundle');
const {getChromium,discoverBrowser}=require('../../../factory/qa/browser');
const root=path.resolve(__dirname,'../../../..'),cache=path.join(root,'.factory-cache/live/collegium-balticum/migration');
const read=file=>JSON.parse(fs.readFileSync(file));
let browser;
(async()=>{
 const pointer=read(path.join(cache,'gallery-ready.json')),bundle=path.join(root,pointer.bundle);
 const manifest=verify(bundle,require('../../../../docs/projects/collegium-balticum/live.json'));
 if(manifest.kind!=='cb-gallery-originals'||sha(fs.readFileSync(path.join(bundle,'manifest.json')))!==pointer.manifestSha256)throw Error('Gallery provenance mismatch');
 const originals=read(path.join(bundle,'gallery.json'));
 const result=spawnSync('node',['scripts/projects/collegium-balticum/runtime.js','wp','eval-file','/var/www/html/wp-content/themes/mwstudios-wordpress-factory/scripts/projects/collegium-balticum/migrate/gallery-qa.php'],{cwd:root,encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr||'WordPress query failed');
 const wordpress=JSON.parse(result.stdout),checks=[];
 if(wordpress.rows.length!==21||originals.length!==21)throw Error('Expected 21 full-size originals');
 for(const original of originals){
  const row=wordpress.rows.find(r=>r.sourceUrl===original.sourceUrl);
  if(original.status!=='DONE'||!row||row.type!=='attachment'||row.sha256!==original.sha256||row.width!==original.width||row.height!==original.height)throw Error('Attachment integrity mismatch');
  if(new URL(row.url).origin!=='http://localhost:8000'||!row.thumbnails.some(t=>t.alt===row.alt))throw Error('Local origin / ALT mismatch');
  const response=await fetch(row.url,{redirect:'error',signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await response.arrayBuffer());
  if(response.status!==200||!/^image\/jpeg/.test(response.headers.get('content-type'))||sha(bytes)!==original.sha256)throw Error('Original download integrity mismatch');
  checks.push({sourceUrl:row.sourceUrl,id:row.id,localUrl:row.url,httpStatus:response.status,bytes:bytes.length,sha256:sha(bytes),width:row.width,height:row.height});
 }
 browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,args:['--no-sandbox']});
 const views=[];
 for(const [view,viewport]of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844},narrow:{width:320,height:844}})){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await page.goto('http://localhost:8000/dni-otwarte/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const links=page.locator('a.rl-gallery-link');
  if(await links.count()!==21)throw Error('Missing gallery links');
  const images=[];
  for(let index=0;index<(view==='narrow'?1:21);index++){
   const link=links.nth(index),href=await link.getAttribute('href'),expected=checks.find(r=>r.localUrl===href);
   if(!expected)throw Error('Non-original gallery href');
   const thumb=await link.locator('img').getAttribute('src');
   const row=wordpress.rows.find(r=>r.id===expected.id);
   if(!row.thumbnails.some(t=>t.url===thumb))throw Error('Thumbnail changed');
   // Reveal an existing tab if the source gallery is in an inactive panel.
   await link.evaluate(a=>{const panels=[];for(let n=a.parentElement;n;n=n.parentElement)if(n.getAttribute('role')==='tabpanel')panels.unshift(n);for(const p of panels)document.querySelector(`[aria-controls="${p.id}"]`)?.click();});
   await link.focus();await page.keyboard.press('Enter');
   const dialog=page.locator('dialog[open]');await dialog.waitFor();
   const size=await dialog.locator('img').evaluate(async img=>{await img.decode();return{src:img.src,width:img.naturalWidth,height:img.naturalHeight};});
   if(size.src!==href||size.width!==expected.width||size.height!==expected.height)throw Error('Lightbox loads wrong full-size image');
   const fits=await dialog.evaluate(d=>[d,...d.querySelectorAll('button,img')].every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}));
   if(!fits)throw Error('Lightbox image or controls outside viewport');
   if(index===0){await dialog.locator('[data-next]').focus();await page.keyboard.press('Tab');if(!await dialog.evaluate(d=>d.contains(document.activeElement)))throw Error('Modal Tab escapes');await page.keyboard.press('Shift+Tab');if(!await dialog.evaluate(d=>d.contains(document.activeElement)))throw Error('Modal Shift+Tab escapes');}
   if(index===0)await page.screenshot({path:path.join(cache,'task4f/gallery-completion/CB-05-'+view+'-lightbox.png')});
   await page.keyboard.press('ArrowRight');
   const nextHref=await links.nth((index+1)%21).getAttribute('href');
   const next=await dialog.locator('img').evaluate(async img=>{await img.decode();return img.src;});
   if(next!==nextHref)throw Error('ArrowRight failed');
   await page.keyboard.press('ArrowLeft');
   if(await dialog.locator('img').getAttribute('src')!==href)throw Error('ArrowLeft failed');
   await page.keyboard.press('Escape');
   if(await page.locator('dialog[open]').count()||!await link.evaluate(a=>document.activeElement===a))throw Error('Escape/focus return failed');
   images.push({index,...size,enter:true,arrows:true,escape:true,focusReturns:true,thumbnailUnchanged:true,fitsViewport:fits});
  }
  if(errors.length)throw Error('JavaScript errors: '+errors.join(', '));
  views.push({view,images,errors});await page.close();
 }
 await browser.close();
 const evidence={at:new Date().toISOString(),manifestSha256:pointer.manifestSha256,runner:manifest.runner,wordpress,checks,views};
 const out=path.join(cache,'task4f/gallery-completion');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'gallery-qa.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({originals:checks.length,attachments:wordpress.attachments,views:views.length,keyboardImageChecks:views.reduce((n,v)=>n+v.images.length,0),status:'PASS'}));
})().catch(async e=>{console.error(e.message);await browser?.close();process.exitCode=1;});
