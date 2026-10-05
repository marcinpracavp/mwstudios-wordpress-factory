const test = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('./canvas-audit');

test('canvas audit catches an orphaned visible cluster and requires route ownership', () => {
  const manifest = {
    snapshotVersion: '1.1',
    sections: [{ id: 'hero' }, { id: 'categories' }],
    routes: [{ id: 'home', frameNodeId: '50:3', sections: ['hero'] }],
    canvasAudit: [{ frameNodeId: '50:3', nodes: [
      { nodeId: '125:18', name: 'Slider', type: 'FRAME', x: 0, y: 117, width: 1920, height: 421, visible: true, role: 'section', sectionId: 'hero' },
      { nodeId: '125:1767', name: 'Category tiles', type: 'FRAME', x: 240, y: 509, width: 1440, height: 334, visible: true, role: 'section', sectionId: 'categories' }
    ] }]
  };
  assert.match(validate(manifest).join('\n'), /Canvas section omitted from route home\/categories/);
  manifest.canvasAudit[0].nodes[1].role = 'unassigned';
  delete manifest.canvasAudit[0].nodes[1].sectionId;
  assert.match(validate(manifest).join('\n'), /Unassigned visible canvas node home\/125:1767/);
  manifest.routes[0].sections.push('categories');
  manifest.canvasAudit[0].nodes[1].role = 'section';
  manifest.canvasAudit[0].nodes[1].sectionId = 'categories';
  assert.deepEqual(validate(manifest), []);
});

test('canvas audit rejects a visible text node when its assigned snapshot denies text', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { writeFileSync, mkdirSync } = fs;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-canvas-audit-'));
  mkdirSync(path.join(root, 'sections'));
  writeFileSync(path.join(root, 'sections', 'article.json'), JSON.stringify({ desktop: { height: 487 }, notes: ['The current subtree exposes no text or native content fields.'] }));
  const manifest = { snapshotVersion: '1.1', sections: [{ id: 'article', snapshot: 'sections/article.json' }],
    routes: [{ id: 'post', frameNodeId: '51:3889', sections: ['article'] }], canvasAudit: [{ frameNodeId: '51:3889', nodes: [
      { nodeId: '125:2163', type: 'TEXT', x: 604, y: 807, width: 712, height: 393, visible: true, role: 'section', sectionId: 'article' }
    ] }] };
  assert.match(validate(manifest, undefined, root).join('\n'), /Canvas\/source contradiction article\/125:2163/);
});

test('canvas audit rejects a semantic section crop that excludes assigned copy', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-canvas-topology-'));
  try {
    fs.mkdirSync(path.join(root, 'sections'));
    fs.writeFileSync(path.join(root, 'sections', 'overview.json'), JSON.stringify({ desktop: { x: 240, y: 171, width: 712, height: 461 } }));
    const manifest={snapshotVersion:'1.1',sections:[{id:'overview',snapshot:'sections/overview.json'}],
      routes:[{id:'about',frameNodeId:'89:2',sections:['overview']}],canvasAudit:[{frameNodeId:'89:2',nodes:[
        {nodeId:'image',type:'FRAME',x:240,y:171,width:712,height:461,visible:true,role:'section',sectionId:'overview'},
        {nodeId:'copy',type:'TEXT',x:1083,y:182,width:597,height:409,visible:true,role:'section',sectionId:'overview'}
      ]}]};
    assert.match(validate(manifest,undefined,root).join('\n'),/Canvas\/section topology contradiction about\/overview/);
  } finally { fs.rmSync(root,{recursive:true}); }
});
