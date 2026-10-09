const assert = require('node:assert/strict');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { discoverBrowser, getChromium } = require('../../scripts/factory/qa/browser');
const preview = JSON.parse(fs.readFileSync('.factory-cache/content-qa/preview.json'));
const wp = (...args) => execFileSync('docker', ['compose','-p','factory-live-qa','-f','.devcontainer/docker-compose.yml','exec','-T','wpcli','wp',...args], {encoding:'utf8'}).trim();
(async () => {
  assert.equal(wp('option','get','blog_public'),'0');
  const oldPageSize = wp('option','get','posts_per_page');
  const browser = await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,headless:true,args:['--no-sandbox']});
  const report = {fixtureOnly:true,at:new Date().toISOString(),pages:[],pagination:false};
  try {
    wp('option','update','posts_per_page','2');
    for (const width of [390,1440]) {
      for (const [name,url] of [['front-page',preview.homepage],['blog-page',preview.blog],['hub',preview.hub]]) {
        const page = await browser.newPage({viewport:{width,height:900}});
        await page.route('https://example.com/**',route=>route.fulfill({status:200,body:'QA fixture'}));
        const assets=[],errors=[];
        page.on('response',response=>{if (/\/dist\/.*\.(css|js)(\?|$)/.test(response.url())) assets.push({url:response.url(),status:response.status()});});
        page.on('pageerror',error=>errors.push(error.message));
        assert.equal((await page.goto(url,{waitUntil:'networkidle'})).status(),200);
        assert.equal(await page.locator('h1').count(),1);
        assert.equal(await page.getByRole('contentinfo').count(),1);
        assert.equal(await page.getByRole('link',{name:'Deklaracja dostępności — link testowy QA'}).count(),1);
        assert.equal(await page.locator('body').innerText().then(text=>/Fatal error|Warning:|Parse error/.test(text)),false);
        assert.deepEqual(errors,[]);
        assert.ok(assets.some(asset=>asset.url.includes('.css')));
        assert.ok(assets.some(asset=>asset.url.includes('.js')));
        assert.ok(assets.every(asset=>asset.status===200));
        const overflow = await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(overflow<=1);
        const screenshot = `.factory-cache/content-qa/${name}-${width}.png`;
        await page.screenshot({path:screenshot,fullPage:true});
        if (name==='blog-page') {
          const firstTitles = await page.locator('.mwf-blog-card h2').allTextContents();
          assert.equal(firstTitles.length,2);
          const next = page.getByRole('link',{name:'Następna strona'});
          assert.equal(await next.count(),1);
          await next.click(); await page.waitForLoadState('networkidle');
          const secondTitles = await page.locator('.mwf-blog-card h2').allTextContents();
          assert.ok(secondTitles.length>0);
          assert.ok(firstTitles.every(title=>!secondTitles.includes(title)));
          report.pagination=true;
        }
        report.pages.push({name,url,width,overflow,assets,screenshot,pass:true});
        await page.close();
      }
    }
    fs.writeFileSync('.factory-cache/content-qa/preview-results.json',JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({pages:report.pages.length,pagination:report.pagination}));
  } finally { await browser.close(); wp('option','update','posts_per_page',oldPageSize); }
})().catch(error=>{console.error(error);process.exitCode=1;});
