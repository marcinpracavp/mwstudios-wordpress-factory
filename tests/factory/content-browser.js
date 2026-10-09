const assert = require('node:assert/strict');
const fs = require('fs');
const { discoverBrowser, getChromium } = require('../../scripts/factory/qa/browser');
const fixtures = JSON.parse(fs.readFileSync('.factory-cache/content-qa/fixtures.json', 'utf8'));

(async () => {
    const browser = await getChromium().launch({ executablePath: discoverBrowser().browser.executablePath, headless: true, args: ['--no-sandbox'] });
    const report = { fixtureOnly: true, startedAt: new Date().toISOString(), acfVersion: fixtures.acfVersion, pages: [], interactions: [] };
    try {
        for (const width of [320, 390, 1440, 2048]) {
            for (const [variant, fixture] of Object.entries(fixtures.pages)) {
                const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
                // Avoid external requests from the iframe fixture; source capture uses no interception.
                await page.route('https://example.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>External frame QA</p>' }));
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                const response = await page.goto(fixture.url, { waitUntil: 'networkidle' });
                assert.equal(response.status(), 200, fixture.url);
                assert.equal(await page.locator('h1').count(), 1, `${variant}: one H1`);
                assert.equal(await page.locator('main').count(), 1, 'one main');
                assert.equal(await page.locator('img:not([alt])').count(), 0, 'ALT attributes');
                assert.equal(await page.locator('body').innerText().then(t => t.includes('EMPTY MUST NOT RENDER')), false, 'empty sections');
                assert.deepEqual(errors, [], 'no JavaScript errors');
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
                assert.ok(overflow <= 1, `${variant} ${width}: overflow ${overflow}`);
                const path = `.factory-cache/content-qa/${variant}-${width}.png`;
                await page.screenshot({ path, fullPage: true });
                if (variant === 'flexible' && width === 320) {
                    await page.addStyleTag({ content: 'html{font-size:125%} body{line-height:1.5;letter-spacing:.12em;word-spacing:.16em} .mwf-prose p{margin-bottom:2em}' });
                    const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
                    assert.ok(zoomOverflow <= 1, `200% text + spacing overflow ${zoomOverflow}`);
                    await page.screenshot({ path: '.factory-cache/content-qa/text-200-spacing-320.png', fullPage: true });
                    report.interactions.push('200% base text + text spacing at 320 CSS px; no horizontal overflow');
                }
                if (variant === 'empty') {
                    assert.equal(await page.locator('.mwf-section').count(), 0);
                    assert.equal(await page.locator('[data-mwf-slider-controls]').count(), 0);
                } else {
                    assert.equal(await page.locator('.mwf-section').count(), 13, `${variant}: all modules rendered`);
                    assert.equal(await page.locator('iframe[title]').count(), 1);
                    assert.equal(await page.locator('table caption').innerText(), 'Tabela danych QA');
                    assert.equal(await page.locator('th[scope="col"]').count(), 2);
                    assert.equal(await page.locator('th[scope="row"]').count(), 2);
                    const offers = await page.locator('.mwf-tile h3').allTextContents();
                    assert.deepEqual(offers, ['Oferta otwarta QA', 'Oferta nieustalona QA', 'Oferta zamknięta QA']);
                    assert.ok((await page.locator('.mwf-contact a[href^="tel:"]').first().getAttribute('href')).includes('+48123456789'));
                    assert.ok((await page.locator('.mwf-contact a[href^="mailto:"]').first().getAttribute('href')).includes('qa@example.test'));
                }
                if (variant === 'static') assert.equal(await page.locator('[data-mwf-slider-controls]').count(), 0, 'one slide is static');
                report.pages.push({ variant, url: fixture.url, width, http: response.status(), overflow, screenshot: path, pass: true });
                await page.close();
            }
        }
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.route('https://example.com/**', route => route.fulfill({ status: 200, body: 'QA' }));
        await page.goto(fixtures.pages.contact.url, { waitUntil: 'networkidle' });
        const cities = page.locator('.mwf-contact-cities > [data-mwf-tabs]');
        const cityTabs = cities.locator(':scope > [data-mwf-tablist] [data-mwf-tab]');
        await cityTabs.first().focus(); await page.keyboard.press('End');
        assert.equal(await cityTabs.last().getAttribute('aria-selected'), 'true');
        assert.equal(await cities.locator(':scope > [data-mwf-panel]:visible').count(), 1);
        await page.keyboard.press('Home');
        const departmentTabs = cities.locator(':scope > [data-mwf-panel]:visible [data-mwf-tablist] [data-mwf-tab]');
        await departmentTabs.first().focus(); await page.keyboard.press('ArrowRight');
        assert.equal(await departmentTabs.last().getAttribute('aria-selected'), 'true');
        const details = page.locator('details').first();
        await details.locator('summary').focus(); await page.keyboard.press('Space');
        assert.equal(await details.getAttribute('open'), '');
        await page.keyboard.press('Enter'); assert.equal(await details.getAttribute('open'), null);
        const menuToggle = page.locator('[data-mwf-menu-toggle]');
        await menuToggle.focus(); await page.keyboard.press('Enter');
        assert.equal(await menuToggle.getAttribute('aria-expanded'), 'true');
        const submenu = page.locator('.mwf-nav__submenu-toggle');
        await submenu.focus(); await page.keyboard.press('Space');
        assert.equal(await submenu.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await submenu.getAttribute('aria-expanded'), 'false');
        await page.keyboard.press('Escape');
        assert.equal(await menuToggle.getAttribute('aria-expanded'), 'false');
        await page.locator('.mwf-skip-link').focus(); await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
        report.interactions.push('nested tabs Arrow/Home/End', 'details Enter/Space', 'menu Enter/Space/Escape', 'skip-link focus');
        await page.goto(fixtures.pages['banner-accordion'].url, { waitUntil: 'networkidle' });
        const slider = page.locator('[data-mwf-slider]');
        await slider.locator('[data-mwf-next]').focus(); await page.keyboard.press('Enter');
        assert.equal(await slider.locator('[data-mwf-slide]:visible').count(), 1);
        assert.ok((await slider.locator('[data-mwf-slide]:visible').innerText()).includes('Drugi baner QA'));
        await page.keyboard.press('ArrowLeft');
        assert.ok((await slider.locator('[data-mwf-slide]:visible').innerText()).includes('Pierwszy baner QA'));
        assert.equal(await slider.locator('[hidden] a:visible').count(), 0);
        report.interactions.push('slider Enter/ArrowLeft and hidden slide focusability');
        const base = new URL(fixtures.pages.basic.url).origin;
        for (const url of [`${base}/?cat=${fixtures.category}`, `${base}/?p=${fixtures.posts[0]}`]) {
            const r = await page.goto(url, { waitUntil: 'networkidle' });
            assert.equal(r.status(), 200);
            assert.equal(await page.locator('h1').count(), 1);
            assert.ok(await page.locator('article time[datetime]').count() > 0);
            report.pages.push({ url, nativeBlog: true, pass: true });
        }
        await page.close();
        const noJS = await browser.newPage({ viewport: { width: 320, height: 844 }, javaScriptEnabled: false });
        await noJS.route('https://example.com/**', route => route.fulfill({ status: 200, body: 'QA' }));
        await noJS.goto(fixtures.pages.contact.url, { waitUntil: 'networkidle' });
        assert.ok(await noJS.locator('.mwf-contact-cities [data-mwf-panel]:visible').count() >= 3);
        assert.equal(await noJS.locator('#mwf-main-menu').isVisible(), true);
        report.interactions.push('without JS: menu and all contact panels readable');
        for (const url of [base + '/', base + '/?s=QA']) {
            const response = await noJS.goto(url, { waitUntil: 'networkidle' });
            assert.equal(response.status(), 200);
            assert.equal(await noJS.locator('h1').count(), 1);
        }
        await noJS.close();
        report.pass = true;
    } catch (error) {
        report.pass = false; report.error = error.stack; throw error;
    } finally {
        report.finishedAt = new Date().toISOString();
        fs.writeFileSync('.factory-cache/content-qa/results.json', JSON.stringify(report, null, 2) + '\n');
        await browser.close();
    }
    console.log(`PASS: ${report.pages.length} real WordPress renders + ${report.interactions.length} interaction checks`);
})().catch(error => { console.error(error); process.exitCode = 1; });
