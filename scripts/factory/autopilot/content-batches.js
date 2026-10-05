const path = require('path');
const { hash, ROOT, SNAPSHOT, inside, read } = require('./common');
function projectPrefix() {
  const value=read(path.join(ROOT,'factory/project.json')).project?.prefix || 'factory';
  return String(value).replace(/[^a-z0-9_]/gi,'_').replace(/^([^a-z])/i,'p_$1').toLowerCase();
}
function criticalMediaRecords(content, manifest) {
  const existing = new Set((content.fields || []).map(f => `${f.section}:${f.nodeId}`));
  const records = [];
  for (const section of manifest.sections || []) {
    const snapshot = read(inside(SNAPSHOT, section.snapshot));
    const layoutNodes = new Set((snapshot.layout?.regions || []).map(region => String(region.sourceNodeId || '')));
    const language = manifest.routes?.find(route => route.sections?.includes(section.id))?.language || 'pl';
    for (const asset of snapshot.assets || []) {
      const nodeId = String(asset.sourceNodeId || '');
      const image = String(asset.path || '');
      // Decorative SVGs can remain code-native. Raster media anchoring the
      // source layout must be imported into WordPress so its absence cannot
      // collapse a section (for example a footer map/form decoration).
      if (!nodeId || !layoutNodes.has(nodeId) || !/\.(png|jpe?g|webp)$/i.test(image) || existing.has(`${section.id}:${nodeId}`)) continue;
      const fieldName = `${projectPrefix()}_${section.id.replaceAll('-', '_')}_media_${nodeId.replaceAll(':', '_')}`;
      records.push({ nodeId, fieldName, type: 'image', returnFormat: 'id', language, section: section.id,
        value: { media: { sourceNodeId: nodeId, path: image } } });
    }
  }
  return records;
}
// Source-bound identities: reordered source arrays keep the same product batches.
function plan(content, manifest, size = 6) {
  if (!Number.isInteger(size) || size < 1 || size > 12) throw Error('INVALID_CONTENT_BATCH_SIZE');
  const fields = [...(content.fields || []), ...criticalMediaRecords(content, manifest)], products = fields.filter(f=>f.type==='product');
  const seen=new Set(), tasks=[];
  const task=(id,records,kind)=>({id,type:'native-content',class:kind,title:`${kind}: ${records.length} source records`,
    sections:[...new Set(records.map(f=>f.section))], routes:[], contentRecords:records,files:['scripts/factory/project/native-batch.js','scripts/factory/project/import-content.php','scripts/factory/project/commerce-probe.php'],
    contentKeys:records.map(f=>`${f.language}:${f.nodeId}:${f.fieldName}`),budget:{maxUncachedTokens:400000,maxOutputTokens:50000},
    instructions:'Only these records. Import/probe idempotently by source identity; never invoke an unscoped whole-site importer. Reuse existing schemas/media and preserve editor overrides.'});
  // Keep product batches stable, but do not create a new model session merely
  // because a record's hash begins with a different character.
  const buckets=new Map();
  for(const p of products){
    if(!p.nodeId||!p.section||!p.fieldName)throw Error('PRODUCT_SOURCE_IDENTITY_REQUIRED');
    const identity=`${p.language}:${p.nodeId}:${p.fieldName}`;
    if(seen.has(identity))continue;seen.add(identity);
    const bucket=`${p.section}:${p.language}`;
    if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket).push(p);
  }
  for(const [bucket,records] of [...buckets].sort()){
    records.sort((a,b)=>a.nodeId.localeCompare(b.nodeId));
    for(let i=0;i<records.length;i+=size){const chunk=records.slice(i,i+size);tasks.push(task(`products-${hash(chunk.map(f=>`${f.section}:${f.language}:${f.nodeId}:${f.fieldName}`).join('|')).slice(0,16)}`,chunk,'product-import'));}
  }
  // A checkpoint remains record-bound via contentKeys, while one worker can
  // safely process several small sections through the scoped adapter.
  const records=fields.filter(f=>f.type!=='product').sort((a,b)=>
    `${a.section}:${a.language}:${a.nodeId}:${a.fieldName}`.localeCompare(`${b.section}:${b.language}:${b.nodeId}:${b.fieldName}`));
  let chunk=[],bytes=0;
  const flush=()=>{if(chunk.length)tasks.push(task(`content-${hash(chunk.map(f=>`${f.section}:${f.language}:${f.nodeId}:${f.fieldName}`).join('|')).slice(0,16)}`,chunk,'content-import'));chunk=[];bytes=0;};
  for(const record of records){
    const recordBytes=Buffer.byteLength(JSON.stringify(record));
    if(chunk.length && (chunk.length>=24 || bytes+recordBytes>12000))flush();
    chunk.push(record);bytes+=recordBytes;
  }
  flush();
  for(const section of [...new Set(products.map(p=>p.section))]){
    const records=products.filter(p=>p.section===section);
    for(let i=0;i<records.length;i+=size){const chunk=records.slice(i,i+size);tasks.push({...task(`listing-${hash(chunk.map(f=>`${f.section}:${f.language}:${f.nodeId}:${f.fieldName}`).join('|')).slice(0,16)}`,chunk,'listing-bind'),
      routes:manifest.routes.filter(r=>r.sections.includes(section)).slice(0,1),
      instructions:'Bind ONLY these already imported native products to the existing listing relation. Preserve source order using contentKeys; append/upsert, never replace sibling batches. The reusable listing template is built once in the component phase. Pagination comes from native query totals.'});}
  }
  return tasks;
}
module.exports={plan,criticalMediaRecords};
