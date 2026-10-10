/** Read-only, reproducible audit of the 19 real CB views. No source import or email. */
const fs = require('fs'), path = require('path');
const { getChromium, discoverBrowser } = require('../../../factory/qa/browser');
const cache = path.resolve(__dirname, '../../../../.factory-cache/live/collegium-balticum/migration');
const pages = JSON.parse(fs.readFileSync(path.join(cache, 'source.json'))).pages;
const phase = process.env.CB_AUDIT_PHASE || 'after';
async function main() {
  const browser = await getChromium().launch({ executablePath: discoverBrowser().browser.executablePath, args: ['--no-sandbox'] });
  const rows = [];
  for (const record of pages.filter(r=>!process.env.CB_ID||r.id===process.env.CB_ID)) for (const [view, width, height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' || route.request().url().startsWith('data:') ? route.continue() : route.abort());
    const response = await page.goto('http://localhost:8000' + record.path, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('img').forEach(i=>i.loading='eager'); await Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))); });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const axe = await page.evaluate(async () => {
      const results = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] } });
      return { version: results.testEngine.version, violations: results.violations, incomplete: results.incomplete, passes: results.passes.map(rule=>rule.id) };
    });
    const geometry = await page.evaluate(() => {
      const rect = element => { const r=element.getBoundingClientRect(),s=getComputedStyle(element);return { x:r.x,y:r.y+scrollY,width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,color:s.color,background:s.backgroundColor }; };
      return { headings:[...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main h6')].filter(n=>n.getBoundingClientRect().height).map(n=>({text:n.textContent.trim(),tag:n.tagName,...rect(n)})), images:[...document.querySelectorAll('main img')].filter(n=>n.getBoundingClientRect().height).map(n=>({alt:n.alt,src:n.src,...rect(n)})),sections:[...document.querySelectorAll('main .cb-section,header.cb-header,footer')].map(n=>({classes:n.className,...rect(n)})), performance: { paint:performance.getEntriesByType('paint').map(n=>({name:n.name,start:n.startTime})),navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,transferSize:n.transferSize})),resources:performance.getEntriesByType('resource').filter(n=>new URL(n.name).hostname==='localhost').map(n=>({url:n.name,type:n.initiatorType,bytes:n.decodedBodySize,duration:n.duration})) } };
    });
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => ({ text:document.activeElement.textContent.trim(),href:document.activeElement.getAttribute('href') }));
    await page.keyboard.press('Enter');
    const skipTarget = await page.evaluate(()=>document.activeElement.id);
    const states = {};
    const menu = page.locator('.hamburger');
    if (view==='mobile' && await menu.count()) {
      await menu.focus();await page.keyboard.press('Enter');
      states.menu = await page.evaluate(async()=>({expanded:document.querySelector('.hamburger').getAttribute('aria-expanded'),violations:(await axe.run(document.querySelector('.cb-header'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations}));
      await page.keyboard.press('Escape');
      states.menu.escapeReturnsFocus=await menu.evaluate(n=>document.activeElement===n&&n.getAttribute('aria-expanded')==='false');
      states.menu.focusStyle=await menu.evaluate(n=>({outline:getComputedStyle(n).outlineStyle,width:getComputedStyle(n).outlineWidth}));
    }
    const gallery=page.locator('.gallery a[href],.rl-gallery a[href]').first();
    if(await gallery.count() && await gallery.isVisible()) {
      await gallery.focus();await page.keyboard.press('Enter');
      const dialog=page.locator('dialog[open]');
      if(await dialog.count()) {
        states.gallery={violations:await page.evaluate(async()=>(await axe.run(document.querySelector('dialog[open]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations)};
        await page.keyboard.press('Escape');states.gallery.escapeReturnsFocus=await gallery.evaluate(n=>document.activeElement===n);
      }
    }
    states.form=await page.evaluate(async()=>{
      const form=document.querySelector('form.wpcf7-form');if(!form)return null;
      const data=new FormData(form);for(const key of [...data.keys()])if(!key.startsWith('_')&&key!=='action')data.delete(key);
      const response=await fetch(form.getAttribute('action'),{method:'POST',headers:{Accept:'application/json'},body:data});const text=await response.text();let body;try{body=JSON.parse(text)}catch{body={nonJson:true,text:text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,300)}}return{action:form.getAttribute('action'),invalidStatus:response.status,body};
    });
    if(states.form){
      // Exercise server errors through the real frontend; all fields remain empty.
      await page.evaluate(()=>{const form=document.querySelector('form.wpcf7-form');form.reportValidity=()=>true;form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
      await page.waitForFunction(()=>document.querySelector('.cb-form-status[role="alert"]')?.textContent.trim());
      states.form.frontend=await page.evaluate(()=>({invalidFields:[...document.querySelectorAll('form [aria-invalid="true"]')].map(n=>({name:n.name,describedBy:n.getAttribute('aria-describedby'),message:n.validationMessage})),focus:document.activeElement.name,alert:document.querySelector('.cb-form-status').textContent.trim()}));
      if(states.form.invalidStatus!==422||states.form.frontend.invalidFields.length!==5||states.form.frontend.focus!=='first-name')throw Error('Form error association/focus regression');
    }
    const profile=page.locator('.partners-content[tabindex="0"]').first();
    if(await profile.count()){
      await profile.focus();states.profile=await profile.evaluate(async n=>({visible:getComputedStyle(n.querySelector('.partners-content-details')).opacity==='1',violations:(await axe.run(n,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations}));
      await page.keyboard.press('Escape');states.profile.dismissed=await profile.evaluate(n=>getComputedStyle(n.querySelector('.partners-content-details')).opacity==='0'&&n.querySelector('.partners-content-details').tabIndex===-1);
    }
    // WCAG 1.4.12 text-spacing and 320 CSS px reflow are separate checks.
    await page.setViewportSize({ width:320,height:844 });
    const reflow = await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth}));
    await page.addStyleTag({ content: '.cb-site p,.cb-site li,.cb-site a,.cb-site input,.cb-site textarea{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}.cb-site p{margin-bottom:2em!important}' });
    const spacing = await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,clipped:[...document.querySelectorAll('main p,main h1,main h2,main h3,main a')].filter(n=>{const s=getComputedStyle(n);return !n.classList.contains('screen-reader-text')&&n.getBoundingClientRect().height>0&&s.overflowY==='hidden'&&n.scrollHeight>n.clientHeight+1}).map(n=>({tag:n.tagName,text:n.textContent.trim().slice(0,100)}))}));
    rows.push({ id:record.id,view,url:page.url(),status:response.status(),axe,geometry,keyboard:{skip,skipTarget},states,reflow,spacing });
    console.log(record.id,view,'violations',axe.violations.reduce((n,r)=>n+r.nodes.length,0),'spacing overflow',spacing.overflow);
    await page.close();
  }
  await browser.close();
  const output=path.join(cache,process.env.CB_AUDIT_DIR||'task4e');fs.mkdirSync(output,{recursive:true});const file=path.join(output,'audit-'+phase+'.json');
  const previous=process.env.CB_ID&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).rows.filter(r=>r.id!==process.env.CB_ID):[];
  fs.writeFileSync(file,JSON.stringify({at:new Date().toISOString(),phase,externalEmbeds:'Blocked in automation; manual captions/document/screen-reader checks remain required',rows:[...previous,...rows].sort((a,b)=>a.id.localeCompare(b.id)||a.view.localeCompare(b.view))},null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
