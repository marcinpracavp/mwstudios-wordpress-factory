// Foundation QA hook for the current Emko route inventory.
// State preparation stays empty until a source-backed interactive state is
// assigned; no legacy commerce session or product slug is synthesized here.
const ROUTES = new Set([
  'home',
  'blog',
  'catalogues',
  'blog-post',
  'service',
  'about',
  'contact',
  'product-list',
  'product',
]);

async function prepare({ page, route, baseUrl }) {
  if (!route || !ROUTES.has(route.id)) return;

  // The Docker runtime has no pretty-permalink rewrite, so the declared
  // product-list alias can fall through to the home template. Reuse the
  // existing published Produkty page through WordPress' native query route;
  // never create a page or fabricate product records here.
  if (route.id === 'product-list') {
    const skeleton = page.locator('[data-factory-component="route-skeleton"][data-factory-route="product-list"]');
    const currentUrl = new URL(page.url());
    if (currentUrl.pathname.replace(/\/+$/, '/') === '/produkty/' && !(await skeleton.count())) {
      const fallbackUrl = new URL('/?pagename=produkty', baseUrl);
      const response = await page.goto(fallbackUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (response?.status() !== 200) throw new Error(`PRODUCT_LIST_ROUTE_PREPARATION_HTTP_${response?.status()}`);
    }
  }

  await page.locator('[data-factory-component="route-skeleton"]').waitFor({ state: 'attached' });

  if (route.id === 'product-list') {
    const productCards = page.locator('[data-factory-section="product-list-items"] [data-factory-component="product-card"]');
    if (!(await productCards.count())) throw new Error('PRODUCT_LIST_SOURCE_PRODUCTS_UNAVAILABLE');
    const requestedCategory = typeof route.state?.productCategory === 'string'
      ? route.state.productCategory
      : typeof route.state?.category === 'string'
        ? route.state.category
        : '';
    if (requestedCategory !== '') {
      const menu = page.locator('[data-factory-section="product-list-menu"]');
      await menu.waitFor({ state: 'attached' });
      const control = menu.getByRole('link', { name: requestedCategory, exact: true });
      if (await control.count()) await control.click();
    }
    const filterState = route.state?.filters && typeof route.state.filters === 'object'
      ? route.state.filters
      : route.state || {};
    const filterSection = page.locator('[data-factory-section="product-list-filters"]');
    const filterInputs = [
      ['strength', filterState.strength],
      ['extension', filterState.extension],
    ];
    let hasFilterState = false;
    for (const [name, requestedValue] of filterInputs) {
      const value = Number(requestedValue);
      if (!Number.isFinite(value)) continue;
      const input = filterSection.locator(`input[name="${name}"]`);
      if (!(await input.count())) continue;
      await input.fill(String(Math.max(0, Math.min(500, Math.round(value)))));
      await input.dispatchEvent('input');
      hasFilterState = true;
    }
    if (hasFilterState && route.state?.submitFilters === true) {
      const submit = filterSection.getByRole('button', { name: 'Szukaj', exact: true });
      if (await submit.count()) await submit.click();
    }
    return;
  }

  if (route.id === 'product') {
    await page.locator('[data-factory-section="product-gallery"]').waitFor({ state: 'attached' });
    return;
  }

  if (route.id !== 'home') return;

  const slider = page.locator('[data-factory-section="home-slider"]');
  await slider.waitFor({ state: 'attached' });

  const requestedSlide = Number.isInteger(route.state?.slide)
    ? route.state.slide
    : Number.isInteger(route.state?.slideIndex)
      ? route.state.slideIndex
      : null;
  if (requestedSlide !== null) {
    const control = slider.locator(`[data-home-slider-slide="${requestedSlide}"]`);
    if (await control.count()) await control.click();
  }

  const popularCategory = Number.isInteger(route.state?.popularCategory)
    ? route.state.popularCategory
    : Number.isInteger(route.state?.category)
      ? route.state.category
      : null;
  if (popularCategory === null) return;

  const popular = page.locator('[data-factory-section="home-popular-products"]');
  await popular.waitFor({ state: 'attached' });
  const categoryControl = popular.locator(`[data-home-popular-category="${popularCategory}"]`);
  if (await categoryControl.count()) await categoryControl.click();
}

module.exports = { prepare };
