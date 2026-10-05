const test = require('node:test');
const assert = require('node:assert/strict');
const { prepare, queryPath, unavailableCapture, isStaticPageRoute } = require('./route-readiness');

test('an undeclared runtime keeps its route and never queries WordPress', () => {
  assert.deepEqual(prepare({ id: 'home', path: '/' }, { wp: () => assert.fail('no WP access expected') }), {
    routeId: 'home', ready: true, provisioned: false, path: '/', mode: 'declared',
  });
});

test('posts archive is driven by runtime metadata rather than a route ID', () => {
  const calls=[];
  const route={id:'news-index',path:'/aktualnosci/',runtime:{kind:'posts-archive',slug:'aktualnosci',title:'Aktualności'}};
  const values=new Map([
    ['option get page_for_posts','0'],
    ['post list --post_type=page --post_status=any --name=aktualnosci --field=ID',''],
    ['post create --post_type=page --post_status=publish --post_title=Aktualności --post_name=aktualnosci --porcelain','71'],
    ['option get permalink_structure',''],
  ]);
  const result=prepare(route,{runtime:'localwp',wp:args=>{calls.push(args);return values.get(args.join(' ')) || '';}});
  assert.equal(result.pageId,71);assert.equal(result.path,'/?page_id=71');
  assert.deepEqual(calls.at(-2),['option','update','page_for_posts','71']);
});

test('a declared page resolves through the Docker query fallback', () => {
  const route={id:'materials',path:'/materialy/',runtime:{kind:'page',slug:'materialy',title:'Materiały'}};
  const result=prepare(route,{runtime:'docker',wp:args=>{
    if(args.join(' ')==='post list --post_type=page --post_status=any --name=materialy --field=ID')return '24';
    if(args.join(' ')==='option get permalink_structure')return '';
    return '';
  }});
  assert.equal(result.pageId,24);assert.equal(result.path,'/?page_id=24');
  assert.equal(queryPath(route,24,''),'/?page_id=24');
  assert.equal(isStaticPageRoute(route),true);
});

test('native post and product routes require existing source-backed records', () => {
  const post=prepare({id:'article',path:'/article/',runtime:{kind:'post'}},{wp:args=>args.includes('--post_type=post')?'91':''});
  const product=prepare({id:'offer',path:'/offer/',runtime:{kind:'product'}},{wp:args=>args.includes('--post_type=product')?'73':''});
  assert.equal(post.path,'/?p=91');assert.equal(product.path,'/?post_type=product&p=73');
  assert.throws(()=>prepare({id:'missing',path:'/missing/',runtime:{kind:'post'}},{wp:()=>''}),/SOURCE_BACKED_POST_UNAVAILABLE/);
});

test('runtime behavior is not inferred from familiar route names', () => {
  for(const id of ['blog','blog-post','product','product-list']) {
    assert.equal(isStaticPageRoute({id,path:`/${id}/`}),false);
    assert.equal(prepare({id,path:`/${id}/`},{wp:()=>assert.fail('no implicit WP query')}).mode,'declared');
  }
});

test('only a confirmed missing route is exempt from a component retry budget', () => {
  assert.equal(unavailableCapture([{ errors: ['HTTP 404', 'locator.waitFor: waiting for route-skeleton'] }]), true);
  assert.equal(unavailableCapture([{ errors: ['ROUTE_HTTP_404'] }]), true);
  assert.equal(unavailableCapture([{ errors: ['HTTP 404'] }]), false);
  assert.equal(unavailableCapture([{ errors: ['HTTP 500', 'route-skeleton'] }]), false);
});
