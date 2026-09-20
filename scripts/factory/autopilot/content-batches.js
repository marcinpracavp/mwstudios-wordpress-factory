const { hash } = require('./common');
// Source-bound identities: reordered source arrays keep the same product batches.
function plan(content, manifest, size = 3) {
  if (!Number.isInteger(size) || size < 1 || size > 10) throw Error('INVALID_CONTENT_BATCH_SIZE');
  const fields = content.fields || [], products = fields.filter(f=>f.type==='product');
  const seen=new Set(), tasks=[];
  const task=(id,records,kind)=>({id,type:'native-content',class:kind,title:`${kind}: ${records.length} source records`,
    sections:[...new Set(records.map(f=>f.section))], routes:[], contentRecords:records,files:['scripts/factory/project/native-batch.js','scripts/factory/project/import-content.php','scripts/factory/project/commerce-probe.php'],
    contentKeys:records.map(f=>`${f.language}:${f.nodeId}:${f.fieldName}`),budget:{maxUncachedTokens:100000,maxOutputTokens:12000},
    instructions:'Only these records. Import/probe idempotently by source identity; never invoke an unscoped whole-site importer. Reuse existing schemas/media and preserve editor overrides.'});
  // Source sections delimit independent listing groups; chunk by a stable identity prefix.
  const buckets=new Map();
  for(const p of products){
    if(!p.nodeId||!p.section||!p.fieldName)throw Error('PRODUCT_SOURCE_IDENTITY_REQUIRED');
    const identity=`${p.language}:${p.nodeId}:${p.fieldName}`;
    if(seen.has(identity))continue;seen.add(identity);
    const bucket=`${p.section}:${hash(identity).slice(0,1)}`;
    if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket).push(p);
  }
  for(const [bucket,records] of [...buckets].sort()){
    records.sort((a,b)=>a.nodeId.localeCompare(b.nodeId));
    for(let i=0;i<records.length;i+=size){const chunk=records.slice(i,i+size);tasks.push(task(`products-${hash(chunk.map(f=>`${f.section}:${f.language}:${f.nodeId}:${f.fieldName}`).join('|')).slice(0,16)}`,chunk,'product-import'));}
  }
  // Non-product content is section-scoped and record-bounded, including detail options/taxonomy.
  const sections=[...new Set(fields.filter(f=>f.type!=='product').map(f=>f.section))];
  for(const section of sections){
    const records=fields.filter(f=>f.section===section&&f.type!=='product');
    let chunk=[],bytes=0;
    const flush=()=>{if(chunk.length)tasks.push(task(`content-${hash(chunk.map(f=>`${f.section}:${f.language}:${f.nodeId}:${f.fieldName}`).join('|')).slice(0,16)}`,chunk,'content-import'));chunk=[];bytes=0;};
    for(const record of records){const size=Buffer.byteLength(JSON.stringify(record));if(chunk.length && (chunk.length>=24 || bytes+size>6000))flush();chunk.push(record);bytes+=size;}
    flush();
  }
  for(const section of [...new Set(products.map(p=>p.section))]){
    const records=products.filter(p=>p.section===section);
    for(let i=0;i<records.length;i+=size){const chunk=records.slice(i,i+size);tasks.push({...task(`listing-${hash(chunk.map(f=>`${f.section}:${f.language}:${f.nodeId}:${f.fieldName}`).join('|')).slice(0,16)}`,chunk,'listing-bind'),
      routes:manifest.routes.filter(r=>r.sections.includes(section)).slice(0,1),
      instructions:'Bind ONLY these already imported native products to the existing listing relation. Preserve source order using contentKeys; append/upsert, never replace sibling batches. The reusable listing template is built once in the component phase. Pagination comes from native query totals.'});}
  }
  return tasks;
}
module.exports={plan};
