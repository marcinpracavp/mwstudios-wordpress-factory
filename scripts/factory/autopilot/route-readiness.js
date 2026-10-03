// Ensure that canonical source routes can be measured in a stock WordPress
// runtime. This owns only the WordPress routing record needed for a route;
// presentation remains the responsibility of the theme/component task.
const { wp } = require('./wp');
const { resolveRuntime } = require('./common');

const integer = value => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
};

function queryPath(route, pageId, permalinkStructure) {
  if (String(permalinkStructure || '').trim() !== '') return route.path;
  return `/?page_id=${pageId}`;
}

function ensureReachablePermalinks(invoke, runtime) {
  const current = invoke(['option', 'get', 'permalink_structure']);
  // Docker's stock web server has no rewrite contract. With pretty links
  // enabled, WordPress redirects a working query route to an unserved path.
  // LocalWP is intentionally left untouched.
  if (runtime === 'docker' && String(current || '').trim() !== '') {
    invoke(['option', 'update', 'permalink_structure', '']);
    invoke(['rewrite', 'flush']);
    return '';
  }
  return current;
}

function blogArchive(route, invoke = wp, runtime = resolveRuntime()) {
  let pageId = integer(invoke(['option', 'get', 'page_for_posts']));
  if (!pageId) {
    // Reuse a pre-existing /blog page where possible. A page for posts is a
    // WordPress routing record, not implementation content, so creating it
    // here is safe and idempotent when the importer has not supplied one.
    pageId = integer(invoke(['post', 'list', '--post_type=page', '--post_status=any', '--name=blog', '--field=ID']));
    if (!pageId) pageId = integer(invoke([
      'post', 'create', '--post_type=page', '--post_status=publish',
      '--post_title=Blog', '--post_name=blog', '--porcelain',
    ]));
    if (!pageId) throw new Error('BLOG_ARCHIVE_PAGE_PROVISION_FAILED');
    invoke(['option', 'update', 'page_for_posts', String(pageId)]);
  }
  const permalinkStructure = ensureReachablePermalinks(invoke, runtime);
  return { routeId: route.id, ready: true, provisioned: true, pageId,
    path: queryPath(route, pageId, permalinkStructure),
    mode: String(permalinkStructure || '').trim() === '' ? 'query' : 'pretty' };
}

function pageSlug(route) {
  const match = String(route?.path || '').match(/^\/([^/]+)\/$/);
  return match ? match[1] : null;
}
function isStaticPageRoute(route) {
  // Dynamic post/product routes require source-backed record selection; this
  // helper only provisions unambiguous single-slug WordPress pages.
  return !!pageSlug(route) && !['blog', 'blog-post', 'product', 'product-list'].includes(route.id);
}
function staticPage(route, invoke = wp, runtime = resolveRuntime()) {
  const slug = pageSlug(route);
  let pageId = integer(invoke(['post', 'list', '--post_type=page', '--post_status=any', `--name=${slug}`, '--field=ID']));
  if (!pageId) pageId = integer(invoke([
    'post', 'create', '--post_type=page', '--post_status=publish',
    `--post_title=${route.id.replaceAll('-', ' ')}`, `--post_name=${slug}`, '--porcelain',
  ]));
  if (!pageId) throw new Error(`STATIC_PAGE_PROVISION_FAILED: ${route.id}`);
  const permalinkStructure = ensureReachablePermalinks(invoke, runtime);
  return { routeId: route.id, ready: true, provisioned: true, pageId,
    path: queryPath(route, pageId, permalinkStructure),
    mode: String(permalinkStructure || '').trim() === '' ? 'query' : 'pretty' };
}

function blogPost(route, invoke = wp, runtime = resolveRuntime()) {
  // Prefer a record created by the native importer; otherwise provide a
  // clearly tagged runtime shell. The Figma article section may contain only
  // media, so no text content record exists from which the importer could
  // infer a post title on its own.
  let postId = integer(invoke(['post', 'list', '--post_type=post', '--post_status=any', '--meta_key=_factory_autopilot_route', '--meta_value=blog-post', '--field=ID']));
  if (!postId) postId = integer(invoke(['post', 'list', '--post_type=post', '--post_status=any', '--meta_key=_rudnikagro_route_id', '--meta_value=blog-article', '--field=ID']));
  if (!postId) {
    postId = integer(invoke([
      'post', 'create', '--post_type=post', '--post_status=publish',
      '--post_title=Blog post', '--post_name=factory-blog-post', '--porcelain',
    ]));
    if (!postId) throw new Error('BLOG_POST_PROVISION_FAILED');
    invoke(['post', 'meta', 'update', String(postId), '_factory_autopilot_route', 'blog-post']);
  }
  ensureReachablePermalinks(invoke, runtime);
  // A source route such as /blog/wpis/ is a design alias, not necessarily the
  // permalink of its native post. The query route is deterministic in both
  // permalink modes after Docker readiness normalization.
  return { routeId: route.id, ready: true, provisioned: true, postId,
    path: `/?p=${postId}`, mode: 'query' };
}

function product(route, invoke = wp) {
  // `/produkt/` is a Figma design alias, not a reliable WooCommerce
  // permalink. Resolve an existing native product to its deterministic query
  // route so WordPress selects single-product.php without creating product
  // data or falling through to the product archive.
  let productId = integer(invoke(['post', 'list', '--post_type=product', '--post_status=publish', '--meta_key=_factory_autopilot_route', '--meta_value=product', '--field=ID']));
  if (!productId) productId = integer(invoke(['post', 'list', '--post_type=product', '--post_status=publish', '--meta_key=_rudnikagro_route_id', '--meta_value=product', '--field=ID']));
  if (!productId) productId = integer(invoke(['post', 'list', '--post_type=product', '--post_status=publish', '--orderby=ID', '--order=ASC', '--posts_per_page=1', '--field=ID']));
  if (!productId) throw new Error('PRODUCT_ROUTE_SOURCE_UNAVAILABLE: import an existing source-backed product before visual capture');
  return { routeId: route.id, ready: true, provisioned: false, productId,
    path: `/?post_type=product&p=${productId}`, mode: 'query' };
}

function prepare(route, options = {}) {
  const invoke = options.wp || wp;
  const runtime = options.runtime || resolveRuntime();
  if (!route) return { routeId: null, ready: true, provisioned: false, path: null, mode: 'declared' };
  if (route.id === 'blog') return blogArchive(route, invoke, runtime);
  if (route.id === 'blog-post') return blogPost(route, invoke, runtime);
  if (route.id === 'product') return product(route, invoke, runtime);
  if (isStaticPageRoute(route)) return staticPage(route, invoke, runtime);
  return { routeId: route.id, ready: true, provisioned: false, path: route.path || null, mode: 'declared' };
}

function unavailableCapture(measurements) {
  return Array.isArray(measurements) && measurements.length > 0 && measurements.every(measurement => {
    const errors = measurement?.errors || [];
    return errors.some(error => /^ROUTE_HTTP_404$/.test(String(error)))
      || (errors.some(error => /^HTTP 404$/.test(String(error)))
        && errors.some(error => /route-skeleton/.test(String(error))));
  });
}

module.exports = { prepare, blogArchive, blogPost, product, staticPage, pageSlug, isStaticPageRoute, queryPath, unavailableCapture, ensureReachablePermalinks };
