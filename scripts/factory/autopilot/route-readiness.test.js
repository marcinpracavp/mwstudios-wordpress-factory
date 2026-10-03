const test = require('node:test');
const assert = require('node:assert/strict');
const { prepare, queryPath, unavailableCapture, isStaticPageRoute } = require('./route-readiness');

test('non-page routes retain their declared canonical path', () => {
  assert.deepEqual(prepare({ id: 'home', path: '/' }, { wp: () => assert.fail('no WP access expected') }), {
    routeId: 'home', ready: true, provisioned: false, path: '/', mode: 'declared',
  });
});

test('blog readiness provisions a posts page once and uses query routing without permalinks', () => {
  const calls = [];
  const values = new Map([
    ['option get page_for_posts', '0'],
    ['post list --post_type=page --post_status=any --name=blog --field=ID', ''],
    ['post create --post_type=page --post_status=publish --post_title=Blog --post_name=blog --porcelain', '71'],
    ['option get permalink_structure', ''],
  ]);
  const result = prepare({ id: 'blog', path: '/blog/' }, { runtime: 'localwp', wp: args => { calls.push(args); return values.get(args.join(' ')) || ''; } });
  assert.equal(result.pageId, 71); assert.equal(result.path, '/?page_id=71'); assert.equal(result.mode, 'query');
  assert.deepEqual(calls.at(-2), ['option', 'update', 'page_for_posts', '71']);
});

test('blog readiness reuses a configured posts page and pretty URL', () => {
  const result = prepare({ id: 'blog', path: '/blog/' }, { runtime: 'localwp', wp: args => args.join(' ') === 'option get page_for_posts' ? '42' : '/%postname%/' });
  assert.equal(result.pageId, 42); assert.equal(result.path, '/blog/'); assert.equal(result.mode, 'pretty');
  assert.equal(queryPath({ path: '/blog/' }, 42, ''), '/?page_id=42');
});

test('Docker readiness disables unusable pretty links before component capture', () => {
  const calls = [];
  const result = prepare({ id: 'blog', path: '/blog/' }, { runtime: 'docker', wp: args => {
    calls.push(args);
    if (args.join(' ') === 'option get page_for_posts') return '42';
    if (args.join(' ') === 'option get permalink_structure') return '/%postname%/';
    return '';
  } });
  assert.equal(result.path, '/?page_id=42'); assert.equal(result.mode, 'query');
  assert.ok(calls.some(args => args.join(' ') === 'option update permalink_structure '));
  assert.ok(calls.some(args => args.join(' ') === 'rewrite flush'));
});

test('a static page route resolves its native page through the Docker query fallback', () => {
  const calls=[];
  const result=prepare({id:'catalogues',path:'/katalogi/'},{runtime:'docker',wp:args=>{
    calls.push(args);
    if(args.join(' ')==='post list --post_type=page --post_status=any --name=katalogi --field=ID') return '24';
    if(args.join(' ')==='option get permalink_structure') return '';
    return '';
  }});
  assert.equal(result.pageId,24); assert.equal(result.path,'/?page_id=24');
  assert.equal(calls.some(args=>args[0]==='post'&&args[1]==='create'),false);
});
test('an image-only blog-post route receives a tagged native shell instead of a fabricated permalink', () => {
  const calls=[];
  const result=prepare({id:'blog-post',path:'/blog/wpis/'},{runtime:'docker',wp:args=>{
    calls.push(args);
    if(args.join(' ')==='post list --post_type=post --post_status=any --meta_key=_factory_autopilot_route --meta_value=blog-post --field=ID') return '';
    if(args.join(' ')==='post list --post_type=post --post_status=any --meta_key=_rudnikagro_route_id --meta_value=blog-article --field=ID') return '';
    if(args[0]==='post'&&args[1]==='create') return '91';
    if(args.join(' ')==='option get permalink_structure') return '';
    return '';
  }});
  assert.equal(result.postId,91); assert.equal(result.path,'/?p=91');
  assert.ok(calls.some(args=>args.join(' ')==='post meta update 91 _factory_autopilot_route blog-post'));
});
test('dynamic product and post routes are never fabricated as static pages', () => {
  for(const route of [{id:'blog-post',path:'/blog/wpis/'},{id:'product',path:'/produkt/'},{id:'product-list',path:'/produkty/'}]) {
    assert.equal(isStaticPageRoute(route),false);
  }
});

test('a product route selects an existing native product instead of its design alias', () => {
  const calls=[];
  const result=prepare({id:'product',path:'/produkt/'},{wp:args=>{
    calls.push(args);
    if(args.join(' ')==='post list --post_type=product --post_status=publish --meta_key=_factory_autopilot_route --meta_value=product --field=ID') return '';
    if(args.join(' ')==='post list --post_type=product --post_status=publish --meta_key=_rudnikagro_route_id --meta_value=product --field=ID') return '';
    if(args.join(' ')==='post list --post_type=product --post_status=publish --orderby=ID --order=ASC --posts_per_page=1 --field=ID') return '73';
    return '';
  }});
  assert.equal(result.path,'/?post_type=product&p=73');
  assert.equal(result.productId,73);
  assert.equal(calls.some(args=>args[0]==='post'&&args[1]==='create'),false);
});

test('only a confirmed missing route is exempt from a component retry budget', () => {
  assert.equal(unavailableCapture([{ errors: ['HTTP 404', 'locator.waitFor: waiting for route-skeleton'] }]), true);
  assert.equal(unavailableCapture([{ errors: ['ROUTE_HTTP_404'] }]), true);
  assert.equal(unavailableCapture([{ errors: ['HTTP 404'] }]), false);
  assert.equal(unavailableCapture([{ errors: ['HTTP 500', 'route-skeleton'] }]), false);
});
