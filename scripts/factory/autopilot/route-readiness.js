// Generic WordPress runtime routing. Source-specific record creation belongs
// to the project importer; this module only resolves explicitly declared
// runtime kinds and never guesses from route IDs.
const { wp } = require('./wp');
const { resolveRuntime } = require('./common');

const integer = value => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
};

function queryPath(route, pageId, permalinkStructure) {
  return String(permalinkStructure || '').trim() !== '' ? route.path : `/?page_id=${pageId}`;
}

function ensureReachablePermalinks(invoke, runtime) {
  const current = invoke(['option', 'get', 'permalink_structure']);
  if (runtime === 'docker' && String(current || '').trim() !== '') {
    invoke(['option', 'update', 'permalink_structure', '']);
    invoke(['rewrite', 'flush']);
    return '';
  }
  return current;
}

function pageSlug(route) {
  if (route.runtime?.slug) return route.runtime.slug;
  const match = String(route.path || '').match(/^\/([^/]+)\/$/);
  return match ? match[1] : null;
}

function isStaticPageRoute(route) {
  return route?.runtime?.kind === 'page' && !!pageSlug(route);
}

function staticPage(route, invoke = wp, runtime = resolveRuntime()) {
  const slug = pageSlug(route);
  let pageId = integer(invoke(['post', 'list', '--post_type=page', '--post_status=any', `--name=${slug}`, '--field=ID']));
  if (!pageId) pageId = integer(invoke([
    'post', 'create', '--post_type=page', '--post_status=publish',
    `--post_title=${route.runtime?.title || route.id.replaceAll('-', ' ')}`, `--post_name=${slug}`, '--porcelain',
  ]));
  if (!pageId) throw new Error(`STATIC_PAGE_PROVISION_FAILED: ${route.id}`);
  const permalinkStructure = ensureReachablePermalinks(invoke, runtime);
  return { routeId: route.id, ready: true, provisioned: true, pageId,
    path: queryPath(route, pageId, permalinkStructure), mode: String(permalinkStructure || '').trim() === '' ? 'query' : 'pretty' };
}

function postsArchive(route, invoke = wp, runtime = resolveRuntime()) {
  const slug = pageSlug(route);
  if (!slug) throw new Error(`POSTS_ARCHIVE_SLUG_REQUIRED: ${route.id}`);
  let pageId = integer(invoke(['option', 'get', 'page_for_posts']));
  if (!pageId) {
    pageId = integer(invoke(['post', 'list', '--post_type=page', '--post_status=any', `--name=${slug}`, '--field=ID']));
    if (!pageId) pageId = integer(invoke([
      'post', 'create', '--post_type=page', '--post_status=publish',
      `--post_title=${route.runtime?.title || route.id.replaceAll('-', ' ')}`, `--post_name=${slug}`, '--porcelain',
    ]));
    if (!pageId) throw new Error(`POSTS_ARCHIVE_PAGE_PROVISION_FAILED: ${route.id}`);
    invoke(['option', 'update', 'page_for_posts', String(pageId)]);
  }
  const permalinkStructure = ensureReachablePermalinks(invoke, runtime);
  return { routeId: route.id, ready: true, provisioned: true, pageId,
    path: queryPath(route, pageId, permalinkStructure), mode: String(permalinkStructure || '').trim() === '' ? 'query' : 'pretty' };
}

function nativeRecord(route, invoke = wp) {
  const descriptor=route.runtime || {};
  const postType=descriptor.kind === 'product' ? 'product' : descriptor.postType || 'post';
  const status=descriptor.kind === 'product' ? 'publish' : 'any';
  const args=['post','list',`--post_type=${postType}`,`--post_status=${status}`];
  if(descriptor.sourceMetaKey && descriptor.sourceMetaValue) args.push(`--meta_key=${descriptor.sourceMetaKey}`,`--meta_value=${descriptor.sourceMetaValue}`);
  else args.push('--meta_key=_factory_source_route',`--meta_value=${route.id}`);
  args.push('--orderby=ID','--order=ASC','--posts_per_page=1','--field=ID');
  const postId=integer(invoke(args));
  if(!postId) throw new Error(`SOURCE_BACKED_${postType.toUpperCase()}_UNAVAILABLE: ${route.id}`);
  return {routeId:route.id,ready:true,provisioned:false,postId,
    path:postType==='product'?`/?post_type=product&p=${postId}`:`/?p=${postId}`,mode:'query'};
}

function prepare(route, options = {}) {
  const invoke = options.wp || wp;
  const runtime = options.runtime || resolveRuntime();
  if (!route) return { routeId: null, ready: true, provisioned: false, path: null, mode: 'declared' };
  switch(route.runtime?.kind || 'declared') {
    case 'page': return staticPage(route, invoke, runtime);
    case 'posts-archive': return postsArchive(route, invoke, runtime);
    case 'post':
    case 'product': return nativeRecord(route, invoke);
    case 'product-archive':
    case 'declared': return { routeId: route.id, ready: true, provisioned: false, path: route.path || null, mode: 'declared' };
    default: throw new Error(`UNSUPPORTED_ROUTE_RUNTIME: ${route.runtime.kind}`);
  }
}

function unavailableCapture(measurements) {
  return Array.isArray(measurements) && measurements.length > 0 && measurements.every(measurement => {
    const errors = measurement?.errors || [];
    return errors.some(error => /^ROUTE_HTTP_404$/.test(String(error)))
      || (errors.some(error => /^HTTP 404$/.test(String(error))) && errors.some(error => /route-skeleton/.test(String(error))));
  });
}

module.exports = { prepare, postsArchive, nativeRecord, staticPage, pageSlug, isStaticPageRoute, queryPath, unavailableCapture, ensureReachablePermalinks };
