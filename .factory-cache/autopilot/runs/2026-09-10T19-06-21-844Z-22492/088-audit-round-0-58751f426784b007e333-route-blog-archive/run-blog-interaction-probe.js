const fs = require('fs');
const path = require('path');
const { discoverBrowser, getChromium } = require(path.resolve('scripts/factory/qa/browser.js'));

const baseUrl = 'https://autopilot.local';
const blogUrl = `${baseUrl}/blog/`;
const outputPath = path.resolve(
  '.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/088-audit-round-0-58751f426784b007e333-route-blog-archive/blog-interaction-probe.json'
);

async function main() {
  const discovery = discoverBrowser();
  if (!discovery.browser) {
    throw new Error('No supported system browser was found.');
  }

  const browser = await getChromium().launch({
    executablePath: discovery.browser.executablePath,
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const initialResponse = await page.goto(blogUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
  const initial = await page.evaluate(() => {
    const list = document.querySelector('[data-factory-section="blog-post-list"]');
    const pagination = document.querySelector('[data-factory-section="blog-pagination"]');
    const cards = list ? Array.from(list.querySelectorAll('[data-factory-component="blog-post-card"]')) : [];
    const ctas = list ? Array.from(list.querySelectorAll('.c-blog-card__link')) : [];
    const pageLinks = pagination ? Array.from(pagination.querySelectorAll('a[href]')) : [];
    return {
      url: location.href,
      statusText: document.title,
      cardCount: cards.length,
      ctaCount: ctas.length,
      ctaHrefs: ctas.map((link) => link.href),
      paginationLinks: pageLinks.map((link) => ({ text: link.textContent.trim(), href: link.href })),
      currentPage: pagination?.querySelector('.current')?.textContent.trim() || null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    };
  });

  const firstCta = page.locator('[data-factory-section="blog-post-list"] .c-blog-card__link').first();
  const firstCtaHref = await firstCta.getAttribute('href');
  if (!firstCtaHref || new URL(firstCtaHref, blogUrl).origin !== new URL(baseUrl).origin) {
    throw new Error('First blog CTA is missing or not local.');
  }
  const articleNavigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await firstCta.click();
  const articleResponse = await articleNavigation;
  await page.waitForTimeout(400);
  const article = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    h1: document.querySelector('h1')?.textContent.trim() || null,
    is404: document.body.classList.contains('error404')
  }));
  article.httpStatus = articleResponse?.status() ?? null;

  await page.goto(blogUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const pageTwoLink = page.locator('[data-factory-section="blog-pagination"] a[href*="/blog/page/2/"]').first();
  const pageTwoHref = await pageTwoLink.getAttribute('href');
  let pageTwo = { href: pageTwoHref || null, available: Boolean(pageTwoHref) };
  if (pageTwoHref) {
    const pageTwoNavigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await pageTwoLink.click();
    const pageTwoResponse = await pageTwoNavigation;
    await page.waitForTimeout(400);
    pageTwo = await page.evaluate(() => ({
      href: location.href,
      available: true,
      title: document.title,
      h1: document.querySelector('h1')?.textContent.trim() || null,
      is404: document.body.classList.contains('error404'),
      currentPage: document.querySelector('[data-factory-section="blog-pagination"] .current')?.textContent.trim() || null,
      cardCount: document.querySelectorAll('[data-factory-section="blog-post-list"] [data-factory-component="blog-post-card"]').length
    }));
    pageTwo.httpStatus = pageTwoResponse?.status() ?? null;
  }

  const result = {
    browser: discovery.browser.name,
    generatedAt: new Date().toISOString(),
    isolatedContext: true,
    sideEffects: 'Read-only local navigation; no forms, orders, payments, email or registration actions.',
    initial: { httpStatus: initialResponse?.status() ?? null, ...initial },
    article,
    pageTwo,
    pageErrors,
    consoleErrors
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  process.stdout.write(`${JSON.stringify({
    output: path.relative(process.cwd(), outputPath),
    initialStatus: result.initial.httpStatus,
    cards: result.initial.cardCount,
    ctas: result.initial.ctaCount,
    articleStatus: result.article.httpStatus,
    articleIs404: result.article.is404,
    pageTwoStatus: result.pageTwo.httpStatus ?? null,
    pageTwoIs404: result.pageTwo.is404 ?? null,
    pageTwoCurrent: result.pageTwo.currentPage ?? null,
    errors: result.pageErrors.length
  })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
