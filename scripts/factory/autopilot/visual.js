const fs = require('fs');
const path = require('path');
const { ROOT, CACHE, SNAPSHOT, read, write, inside, hash, files, fingerprint } = require('./common');
const { snapshot, pngInfo } = require('./gates');
const { discoverBrowser, getChromium } = require('../qa/browser');
const { sectionOwnership, acceptance } = require('./visual-ownership');
const rel = f => path.relative(ROOT, f).replaceAll('\\', '/');
function loadProjectHooks(hookPath) {
  const projectRoot = path.dirname(hookPath);
  // The host survives worker edits. Reload project-owned preparation and its
  // local helpers so host captures execute the same bytes as fresh worker QA.
  for (const id of Object.keys(require.cache)) {
    const relative = path.relative(projectRoot, id);
    if (relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) delete require.cache[id];
  }
  return fs.existsSync(hookPath) ? require(hookPath) : {};
}
function sourceHash() {
  return hash(files(SNAPSHOT).sort().map(f => `${path.relative(SNAPSHOT, f)}:${hash(fs.readFileSync(f))}`).join('\n'));
}
async function settle(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important}html{scroll-behavior:auto!important}' });
  await page.evaluate(async () => {
    await Promise.race([document.fonts.ready, new Promise((_,reject)=>setTimeout(()=>reject(new Error('FONT_READINESS_TIMEOUT')),15000))]);
    const started = Date.now();
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(400, innerHeight - 100)) {
      if (Date.now() - started > 30000) throw new Error('LAZY_SCROLL_TIMEOUT');
      scrollTo(0, y); await new Promise(r => setTimeout(r, 70));
    }
    await Promise.race([Promise.all(Array.from(document.images).map(im => im.decode().catch(() => {}))), new Promise((_,reject)=>setTimeout(()=>reject(new Error('IMAGE_READINESS_TIMEOUT')),15000))]);
    scrollTo(0, 0);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(250);
}
async function metrics(page) {
  return page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; };
    const style = el => { const s = getComputedStyle(el); return Object.fromEntries(['fontFamily','fontWeight','fontSize','lineHeight','letterSpacing','color','backgroundColor','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft','gap','objectFit','objectPosition'].map(k => [k, s[k]])); };
    return {
      url: location.href, title: document.title, width: innerWidth,
      height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      fontsReady: document.fonts.status === 'loaded',
      sections: Array.from(document.querySelectorAll('[data-factory-section]')).map(el => ({ id: el.dataset.factorySection,
        landmark: el.closest('footer,[role="contentinfo"]') ? 'footer' : el.closest('header,[role="banner"]') ? 'header' : null,
        component: el.dataset.factoryComponent || null, ...rect(el), style: style(el) })),
      texts: Array.from(document.querySelectorAll('h1,h2,h3,p,button,.button,label')).map(el => ({ text: el.textContent.trim(), ...rect(el), style: style(el) })),
      images: Array.from(document.images).map(el => ({ src: el.currentSrc || el.src, loaded: el.complete && el.naturalWidth > 0, ...rect(el), style: style(el) })),
      links: Array.from(document.querySelectorAll('a')).map(el => ({ text: el.textContent.trim(), href: el.getAttribute('href') }))
    };
  });
}
async function sectionSignatures(page,reference,rendered,geometry) {
  const pairs=await page.evaluate(async ({a,b,sections})=>{
    async function load(src){const im=new Image();im.src=src;await im.decode();return im;}
    const images=await Promise.all([load(a),load(b)]);
    return sections.map(s=>{
      const x=Math.floor(s.x),y=Math.floor(s.y),w=Math.ceil(s.width),h=Math.ceil(s.height);
      if(w<1||h<1||images.some(im=>x<0||y<0||x+w>im.width||y+h>im.height)) return {id:s.id};
      return {id:s.id,pair:images.map(im=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);return c.toDataURL('image/png');})};
    });
  },{a:`data:image/png;base64,${fs.readFileSync(reference).toString('base64')}`,b:`data:image/png;base64,${fs.readFileSync(rendered).toString('base64')}`,
    sections:geometry.filter(g=>g.owner!=='header'&&g.owner!=='footer').map(g=>({id:g.id,...g.expected}))});
  return Object.fromEntries(pairs.filter(p=>p.pair).map(p=>[p.id,hash(JSON.stringify(p.pair))]));
}
async function compareImages(page, reference, rendered, config, sections, images = [], pageOnly = false, ownershipRegions = []) {
  const data = await page.evaluate(async ({ reference, rendered, tolerance, sections, images, pageOnly, ownershipRegions }) => {
    async function load(src) { const im = new Image(); im.src = src; await im.decode(); return im; }
    const a = await load(reference), b = await load(rendered);
    const width = Math.max(a.width, b.width), height = Math.max(a.height, b.height);
    const canvas = () => { const c = document.createElement('canvas'); c.width = width; c.height = height; return c; };
    const ca = canvas(), cb = canvas(), diff = canvas();
    const ac = ca.getContext('2d', { willReadFrequently: true }), bc = cb.getContext('2d', { willReadFrequently: true }), dc = diff.getContext('2d');
    ac.fillStyle = bc.fillStyle = '#fff'; ac.fillRect(0,0,width,height); bc.fillRect(0,0,width,height);
    ac.drawImage(a,0,0); bc.drawImage(b,0,0);
    const aa = ac.getImageData(0,0,width,height), bb = bc.getImageData(0,0,width,height), dd = dc.createImageData(width,height);
    let different = 0, absolute = 0;
    const rowDifferences = new Array(height).fill(0);
    const ownership = Object.fromEntries(['header','footer','shared','page','outside','reused'].map(k => [k, { pixels: 0, differentPixels: 0 }]));
    const components = {};
    const imageMask = new Uint8Array(width*height);
    const imageDiagnostics = { interiorPixels:0, interiorDifferentPixels:0, otherPixels:0, otherDifferentPixels:0,
      note:'Diagnostic only: confirm source asset, crop, geometry and border before accepting interior photo differences. No blanket image exemption.' };
    for (const im of images.filter(im=>im.loaded && im.width>=80 && im.height>=80)) {
      const x0=Math.max(0,Math.ceil(im.x)+4),x1=Math.min(width,Math.floor(im.x+im.width)-4);
      for(let y=Math.max(0,Math.ceil(im.y)+4);y<Math.min(height,Math.floor(im.y+im.height)-4);y++) if(x1>x0) imageMask.fill(1,y*width+x0,y*width+x1);
    }
    const labels = new Uint16Array(width * height);
    const owners = [{ owner: pageOnly ? 'outside' : 'page', component: null }];
    function labelBox(s, index) {
      const x0 = Math.max(0, Math.floor(s.x)), x1 = Math.min(width, Math.ceil(s.x + s.width));
      const y0 = Math.max(0, Math.floor(s.y)), y1 = Math.min(height, Math.ceil(s.y + s.height));
      for (let y=y0; y<y1; y++) labels.fill(index, y*width+x0, y*width+x1);
    }
    // Page-only ownership is bounded by source page sections. A footer from another route cannot leak into it.
    const pageSections = sections.filter(s=>s.owner==='page');
    if (pageOnly && pageSections.length) {
      const top = Math.min(...pageSections.map(s=>s.y)), bottom = Math.min(a.height,Math.max(...pageSections.map(s=>s.y+s.height)));
      owners.push({owner:'page',component:null}); labelBox({x:0,y:top,width,height:bottom-top},owners.length-1);
    }
    // Shared component rectangles first, then complete header/footer bands. Every pixel has one owner.
    for (const s of sections.filter(s=>s.owner==='shared')) { owners.push({owner:'shared',component:s.component}); labelBox(s,owners.length-1); }
    const header = ownershipRegions.some(s=>s.owner==='header') ? ownershipRegions.filter(s=>s.owner==='header') : sections.filter(s=>s.owner==='header');
    const footer = ownershipRegions.some(s=>s.owner==='footer') ? ownershipRegions.filter(s=>s.owner==='footer') : sections.filter(s=>s.owner==='footer');
    if (header.length) { owners.push({owner:'header',component:'header'}); labelBox({x:0,y:0,width,height:Math.max(...header.map(s=>s.y+s.height))},owners.length-1); }
    if (footer.length) { const top=Math.min(...footer.map(s=>s.y)); owners.push({owner:'footer',component:'footer'}); labelBox({x:0,y:top,width,height:height-top},owners.length-1); }
    for(const s of sections.filter(s=>s.reused)) { owners.push({owner:'reused',component:null});labelBox(s,owners.length-1); }
    for (let i = 0; i < aa.data.length; i += 4) {
      const x = (i/4)%width, y = Math.floor(i/4/width);
      const delta = Math.max(...[0,1,2].map(k => Math.abs(aa.data[i+k]-bb.data[i+k])));
      const changed = delta > tolerance || x >= a.width || x >= b.width || y >= a.height || y >= b.height;
      absolute += delta;
      if (changed) { different++; rowDifferences[y]++; }
      const assigned = owners[labels[i/4]], bucket = ownership[assigned.owner];
      if(assigned.owner==='page') {
        const prefix=imageMask[i/4]?'interior':'other';
        imageDiagnostics[`${prefix}Pixels`]++; if(changed) imageDiagnostics[`${prefix}DifferentPixels`]++;
      }
      bucket.pixels++; if(changed) bucket.differentPixels++;
      if (assigned.component) {
        const component = components[assigned.component] ||= { owner: assigned.owner, pixels:0, differentPixels:0 };
        component.pixels++; if(changed) component.differentPixels++;
      }
      dd.data[i] = changed ? 255 : Math.round(bb.data[i]*0.35);
      dd.data[i+1] = changed ? 0 : Math.round(bb.data[i+1]*0.35);
      dd.data[i+2] = changed ? 130 : Math.round(bb.data[i+2]*0.35); dd.data[i+3] = 255;
    }
    dc.putImageData(dd,0,0);
    const crops = sections.map(s => {
      const x = Math.max(0,Math.floor(s.x)), y = Math.max(0,Math.floor(s.y));
      const w = Math.max(1,Math.min(width-x,Math.ceil(s.width))), h = Math.max(1,Math.min(height-y,Math.ceil(s.height)));
      function crop(source) { const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(source,x,y,w,h,0,0,w,h);return c.toDataURL('image/png'); }
      let count=0;
      for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) { const i=(yy*width+xx)*4; if(dd.data[i]===255 && dd.data[i+1]===0 && dd.data[i+2]===130) count++; }
      return { id:s.id, owner:s.owner, component:s.component, reused:s.reused || null, pixels:w*h, differentPixels:count, ratio:count/(w*h),
        ...(s.reused ? {} : {reference:crop(ca),rendered:crop(cb),diff:crop(diff)}) };
    });
    for (const bucket of [...Object.values(ownership), ...Object.values(components)]) bucket.ratio=bucket.pixels ? bucket.differentPixels/bucket.pixels : 0;
    return { width, height, differentPixels:different, ratio:different/(width*height), ownership, components, imageDiagnostics, meanMaxChannelDelta:absolute/(width*height),
      referenceSize:{width:a.width,height:a.height}, renderedSize:{width:b.width,height:b.height}, diff:diff.toDataURL('image/png'), crops,
      worstRows: rowDifferences.map((count,y)=>({y,count})).sort((a,b)=>b.count-a.count).slice(0,20) };
  }, { reference: `data:image/png;base64,${fs.readFileSync(reference).toString('base64')}`,
    rendered: `data:image/png;base64,${fs.readFileSync(rendered).toString('base64')}`, tolerance: config.channelTolerance, sections, images, pageOnly, ownershipRegions });
  return data;
}
function savePng(file, data) { fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64')); }
async function captureAll({ output = path.join(CACHE, `visual-${Date.now()}`), routeId = null, responsive = true, acceptanceScope = 'all' } = {}) {
  if (!['all','page'].includes(acceptanceScope)) throw new Error('Invalid acceptance scope');
  const gate = snapshot();
  if (!gate.passed) throw new Error(`SNAPSHOT_NOT_READY: ${gate.errors.slice(0,20).join('; ')}`);
  fs.mkdirSync(output, { recursive: true });
  const m = require('./source-geometry').resolveManifest(), p = read(path.join(ROOT,'factory/project.json'));
  const cfg = read(path.join(ROOT,'factory/autopilot.json'));
  const expectedSource = sourceHash(), implementationHash = fingerprint();
  const routes = m.routes.filter(r => !routeId || r.id === routeId);
  if (!routes.length) throw new Error(`Unknown route ${routeId}`);
  const found = discoverBrowser();
  if (!found.browser) throw new Error('BROWSER_UNAVAILABLE');
  const browser = await getChromium().launch({ executablePath: found.browser.executablePath, headless: true });
  const comparePage = await browser.newPage();
  const statePlan=await require('./state-plan').ensure(m,comparePage);
  const hookPath = path.join(ROOT,'scripts/factory/project/qa-state.js');
  const hooks = loadProjectHooks(hookPath);
  const results = [];
  const reviewedChrome = new Set();
  try {
    const orderedRoutes=[...routes].sort((a,b)=>Number(!!a.state)-Number(!!b.state));
    for (const r of orderedRoutes) {
      const templatePlan=require('./state-plan').routePlan(statePlan,r.id);
      const dir = path.join(output,r.id); fs.mkdirSync(dir,{recursive:true});
      const context = await browser.newContext({ viewport:{width:r.width,height:900}, deviceScaleFactor:1, ignoreHTTPSErrors:true, reducedMotion:'reduce' });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on('pageerror', e => runtimeErrors.push(e.message));
      page.on('console', e => { if(e.type()==='error') runtimeErrors.push(e.text()); });
      const result = { id:r.id, sourceNodeId:r.frameNodeId, capturedAt:new Date().toISOString(), passed:false, errors:[], responsive:[],
        measurementVersion:4, acceptanceScope, templatePlan, geometryHash:hash(JSON.stringify(r.sectionGeometry || {})), geometryCorrection:r.geometryCorrection || null, ownershipRegions:r.ownershipRegions || [] };
      try {
        const url = new URL(r.path,p.environment.localUrl);
        if(url.origin!==new URL(p.environment.localUrl).origin) throw new Error('External route forbidden');
        const response = await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});
        if(response?.status()!==200) result.errors.push(`HTTP ${response?.status()}`);
        if(r.state && typeof hooks.prepare!=='function') throw new Error(`State ${r.state} requires real project qa-state.prepare`);
        // Canonical routes can also require real session data (cart, checkout).
        // The project hook selects applicable routes and does nothing for others.
        if(typeof hooks.prepare==='function') {
          await hooks.prepare({page,route:r,baseUrl:p.environment.localUrl});
        }
        await settle(page);
        const actual = await metrics(page);
        write(path.join(dir,'metrics.json'),actual);
        if(actual.overflow>1) result.errors.push(`Horizontal overflow ${actual.overflow}px`);
        if(!actual.fontsReady) result.errors.push('Fonts not ready');
        if(actual.images.some(i=>!i.loaded)) result.errors.push('Broken images');
        const geometry = r.sections.map(id => {
          const section = m.sections.find(s=>s.id===id);
          const expected = r.sectionGeometry?.[id] || read(inside(SNAPSHOT,section.snapshot)).desktop;
          const matches = actual.sections.filter(s=>s.id===id);
          const observed = matches[0];
          const delta = Object.fromEntries(['x','y','width','height'].map(k=>[k,observed ? observed[k]-expected[k] : null]));
          const passed = matches.length===1 && Object.values(delta).every(v=>Number.isFinite(v)&&Math.abs(v)<=cfg.visual.geometryTolerancePx);
          return {id,...sectionOwnership(m,id,observed),expected,actual:observed,delta,passed};
        });
        const screenshot = path.join(dir,'rendered.png');
        await page.screenshot({path:screenshot,fullPage:true,animations:'disabled',timeout:60000});
        const reference = inside(SNAPSHOT,r.reference);
        const signatures=templatePlan ? await sectionSignatures(comparePage,reference,screenshot,geometry) : {};
        for(const g of geometry) {
          if(signatures[g.id]) g.reused=require('./template-evidence').reuse(templatePlan,g,signatures[g.id],cfg.visual);
        }
        result.geometryHash=hash(JSON.stringify({geometry:r.sectionGeometry || {},ownershipRegions:r.ownershipRegions || [],reused:geometry.filter(g=>g.reused).map(g=>g.id).sort()}));
        // One representative per source header/footer variant and source width in a final capture.
        const skippedOwners = [];
        for (const owner of ['header','footer']) {
          const ids = geometry.filter(s=>s.owner===owner).map(s=>s.id);
          const key = `${owner}:${r.width}:${ids.join(',')}`;
          if (acceptanceScope==='page' || reviewedChrome.has(key)) skippedOwners.push(owner);
          else reviewedChrome.add(key);
        }
        const pixels = await compareImages(comparePage,reference,screenshot,cfg.visual,geometry.map(s=>({id:s.id,owner:s.owner,component:s.component,reused:s.reused,...s.expected})),actual.images,acceptanceScope==='page',r.ownershipRegions || []);
        savePng(path.join(dir,'diff.png'),pixels.diff); delete pixels.diff;
        for(const c of pixels.crops) {
          c.signature=signatures[c.id] || null;
          if(c.reused) continue;
          if(skippedOwners.includes(c.owner)) { for(const kind of ['reference','rendered','diff']) delete c[kind]; continue; }
          for(const kind of ['reference','rendered','diff']) { savePng(path.join(dir,`${c.id}-${kind}.png`),c[kind]); delete c[kind]; }
        }
        if(pixels.referenceSize.width!==pixels.renderedSize.width) result.errors.push('Full page width differs');
        if(acceptanceScope==='all' && Math.abs(pixels.referenceSize.height-pixels.renderedSize.height)>cfg.visual.geometryTolerancePx) result.errors.push('Full page height differs');
        result.geometry=geometry; result.pixels=pixels;
        result.reference={path:r.reference,...pngInfo(reference)};
        result.rendered={path:rel(screenshot),...pngInfo(screenshot)};
        if(responsive && r.responsiveSource==='derived') {
          for(const width of cfg.responsiveWidths.filter(w=>w!==r.width)) {
            await page.setViewportSize({width,height:width<768?844:900});
            await settle(page);
            const responsiveMetrics=await metrics(page);
            const file=path.join(dir,`responsive-${width}.png`);
            await page.screenshot({path:file,fullPage:true,animations:'disabled',timeout:60000});
            const healthy=responsiveMetrics.overflow<=1&&responsiveMetrics.images.every(i=>i.loaded)&&responsiveMetrics.fontsReady;
            result.responsive.push({width,source:'derived',renderHealthy:healthy,screenshot:rel(file)});
            write(path.join(dir,`responsive-${width}.json`),responsiveMetrics);
            if(!healthy) result.errors.push(`Responsive render health ${width}`);
          }
        }
        result.errors.push(...runtimeErrors);
        result.acceptance=acceptance(result,cfg.visual,result.errors,skippedOwners);
        result.chromeReview = { skippedOwners, reason: acceptanceScope==='page' ? 'Deferred to representative final shared audit' : 'One representative per shared section set and width' };
        result.errors=[...result.acceptance.pageErrors,...result.acceptance.sharedErrors];
        result.passed=result.errors.length===0 && acceptanceScope==='all';
        if (acceptanceScope==='page' && cfg.visualDeferral) result.progress=require('./visual-progress').progress(result,{sourceHash:expectedSource,implementationHash,thresholds:cfg.visual},cfg.visualDeferral);
      } catch(e) { result.errors.push(e.message); }
      finally { await context.close(); }
      write(path.join(dir,'comparison.json'),result); results.push(result);
      if(fingerprint()===implementationHash) require('./template-evidence').record(templatePlan,result,rel(path.join(dir,'comparison.json')),cfg.visual);
      console.log(`${r.id}: ${acceptanceScope==='page' ? result.acceptance?.pagePassed?'PAGE PASS':result.progress?.deferred?'DEFERRED TO FINAL':'PAGE FAIL' : result.passed?'PASS':'FAIL'} ${(acceptanceScope==='page'?result.acceptance?.pageErrors||result.errors:result.errors).slice(0,3).join('; ')}`);
    }
  } finally { await browser.close(); }
  if(sourceHash()!==expectedSource || fingerprint()!==implementationHash) throw new Error('Files changed during capture; comparisons are not current');
  const summary={capturedAt:new Date().toISOString(),implementationHash,sourceHash:expectedSource,thresholds:cfg.visual,acceptanceScope,
    buildReady:results.length===routes.length&&results.every(r=>r.acceptance?.pagePassed || r.progress?.deferred),
    deferred:results.filter(r=>r.progress?.deferred).map(r=>({id:r.id,progress:r.progress,comparison:rel(path.join(output,r.id,'comparison.json'))})),
    passed:results.length===routes.length&&results.every(r=>r.passed),pagePassed:results.length===routes.length&&results.every(r=>r.acceptance?.pagePassed===true),
    routes:results.map(r=>({id:r.id,passed:r.passed,pagePassed:r.acceptance?.pagePassed===true,ownership:r.pixels?.ownership,errors:r.errors,comparison:rel(path.join(output,r.id,'comparison.json'))}))};
  write(path.join(output,'summary.json'),summary); write(path.join(CACHE,'latest-visual.json'),{summary:rel(path.join(output,'summary.json'))});
  return summary;
}
if(require.main===module) {
  const args=process.argv.slice(2), idx=args.indexOf('--route');
  const acceptanceScope=args.includes('--page-only')?'page':'all';
  captureAll({routeId:idx>=0?args[idx+1]:null,responsive:!args.includes('--desktop-only'),acceptanceScope})
    .then(r=>{const ready=acceptanceScope==='page'?r.buildReady:r.passed;console.log(`VISUAL ${acceptanceScope} ${r.deferred.length?'DEFERRED TO FINAL':ready?'PASS':'FAIL'}`);process.exitCode=ready?0:1;})
    .catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={captureAll,sourceHash};
