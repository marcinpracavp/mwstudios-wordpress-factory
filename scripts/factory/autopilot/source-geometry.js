// Correct derived coordinates from retained Figma node evidence, without rewriting the frozen snapshot.
const fs = require('fs');
const path = require('path');
const { ROOT, CACHE, SNAPSHOT, read, write, hash, inside } = require('./common');
const registry = path.join(CACHE, 'source-geometry.json');
const manifestFile = path.join(SNAPSHOT, 'manifest.json');
const digest = file => hash(fs.readFileSync(file));
function bounds(nodes, ids, origin) {
  const boxes = ids.map(id=>nodes.find(n=>n.id===id)?.absoluteBoundingBox);
  if (!boxes.length || boxes.some(b=>!b)) throw new Error('SOURCE_GEOMETRY_NODE_MISSING');
  const x = Math.min(...boxes.map(b=>b.x)), y = Math.min(...boxes.map(b=>b.y));
  return {x:x-origin.x,y:y-origin.y,width:Math.max(...boxes.map(b=>b.x+b.width))-x,height:Math.max(...boxes.map(b=>b.y+b.height))-y};
}
function originalGeometry(manifest, route, id) {
  const section = manifest.sections.find(s=>s.id===id);
  if (!route.sections.includes(id) || !section) throw new Error('SOURCE_GEOMETRY_SECTION_UNKNOWN');
  return route.sectionGeometry?.[id] || read(inside(SNAPSHOT,section.snapshot)).desktop;
}

function resolveManifest() {
  const manifest = read(manifestFile);
  if (!fs.existsSync(registry)) return manifest;
  const records = read(registry);
  if (records.manifestHash !== digest(manifestFile)) throw new Error('SOURCE_GEOMETRY_MANIFEST_CHANGED');
  for (const correction of records.routes) {
    const route = manifest.routes.find(r => r.id === correction.id);
    if (!route || route.frameNodeId !== correction.frameNodeId || digest(inside(SNAPSHOT, route.reference)) !== correction.referenceHash
      || digest(inside(ROOT, correction.evidence)) !== correction.evidenceHash) throw new Error('SOURCE_GEOMETRY_EVIDENCE_CHANGED');
    const frame = read(inside(ROOT, correction.evidence)).nodes[route.frameNodeId].document;
    const nodes = [];
    function walk(n) { nodes.push(n); for (const c of n.children || []) walk(c); }
    walk(frame);
    for (const entry of correction.sections) {
      if (JSON.stringify(originalGeometry(manifest,route,entry.id)) !== JSON.stringify(entry.before)) throw new Error('SOURCE_GEOMETRY_PREIMAGE_CHANGED');
      const box = bounds(nodes,entry.nodeIds || [entry.nodeId],frame.absoluteBoundingBox);
      if (entry.after.x!==box.x || entry.after.y!==box.y
        || entry.after.width!==box.width || entry.after.height!==box.height) throw new Error('SOURCE_GEOMETRY_COORDINATES_NOT_PROVEN');
      route.sectionGeometry[entry.id] = entry.after;
    }
    route.geometryCorrection = correction;
  }
  for (const entry of records.ownership || []) {
    const route=manifest.routes.find(r=>r.id===entry.routeId);
    const file=inside(SNAPSHOT,entry.observation);
    if (!route || digest(file)!==entry.observationHash || digest(inside(SNAPSHOT,route.reference))!==entry.referenceHash) throw new Error('SOURCE_OWNERSHIP_EVIDENCE_CHANGED');
    const observation=read(file);
    const node=observation.facts?.flat().find(n=>n.id===entry.nodeId);
    if (observation.source!=='successful-worker-tool-event' || !observation.nodeIds.includes(route.frameNodeId)
      || !node || !['header','footer'].includes(entry.owner)
      || !['x','y','width','height'].every(k=>Number.isFinite(node[k])) || node.width<=0 || node.height<=0
      || node.y<0 || node.y>=route.height) throw new Error('SOURCE_OWNERSHIP_NOT_PROVEN');
    route.ownershipRegions ||= [];
    route.ownershipRegions.push({owner:entry.owner,nodeId:node.id,x:node.x,y:node.y,width:node.width,height:node.height,evidence:entry.observation});
  }
  return manifest;
}

function reconcileOwnership(routeId, observationPath, nodeId, owner) {
  resolveManifest();
  const manifest=read(manifestFile),route=manifest.routes.find(r=>r.id===routeId);
  if(!route) throw new Error('SOURCE_OWNERSHIP_ROUTE_UNKNOWN');
  const file=inside(SNAPSHOT,observationPath),observation=read(file),node=observation.facts?.flat().find(n=>n.id===nodeId);
  if(observation.source!=='successful-worker-tool-event' || !observation.nodeIds.includes(route.frameNodeId)
    || !node || !['header','footer'].includes(owner)
    || !['x','y','width','height'].every(k=>Number.isFinite(node[k])) || node.width<=0 || node.height<=0
    || node.y<0 || node.y>=route.height) throw new Error('SOURCE_OWNERSHIP_NOT_PROVEN');
  const records=fs.existsSync(registry)?read(registry):{manifestHash:digest(manifestFile),routes:[]};
  records.ownership ||= [];
  if(records.ownership.some(e=>e.routeId===routeId&&e.owner===owner)) throw new Error('SOURCE_OWNERSHIP_ALREADY_RECONCILED');
  records.ownership.push({routeId,owner,nodeId,observation:observationPath,observationHash:digest(file),referenceHash:digest(inside(SNAPSHOT,route.reference))});
  write(registry,records);
  console.log(JSON.stringify({routeId,owner,nodeId,y:node.y}));
}

function reconcile(routeId, evidenceFile, mappingFile) {
  const manifest = read(manifestFile), route = manifest.routes.find(r => r.id === routeId);
  const evidence = inside(ROOT, evidenceFile), data = read(evidence);
  const frame = data.nodes?.[route?.frameNodeId]?.document, origin = frame?.absoluteBoundingBox;
  if (!origin || origin.width !== route.width || origin.height !== route.height) throw new Error('SOURCE_GEOMETRY_FRAME_MISMATCH');
  const nodes = [];
  function walk(n) { nodes.push(n); for (const c of n.children || []) walk(c); }
  walk(frame);
  const local = n => ({ x:n.absoluteBoundingBox.x-origin.x, y:n.absoluteBoundingBox.y-origin.y, width:n.absoluteBoundingBox.width, height:n.absoluteBoundingBox.height });
  const close = (a,b) => Math.abs(a-b) < 0.01;
  const sections = [];
  for (const [id, before] of Object.entries(route.sectionGeometry || {})) {
    const definition = manifest.sections.find(s => s.id === id);
    const source = definition && read(inside(SNAPSHOT, definition.snapshot));
    const anchor = nodes.find(n => n.id === source?.source?.desktopNodeId);
    if (!anchor?.absoluteBoundingBox) continue;
    const a = local(anchor);
    // A narrowly identifiable discovery defect: vector bottom mistaken for top.
    // Require a unique same-sized background containing the exact source anchor.
    const candidates = nodes.filter(n => n.type === 'VECTOR' && n.absoluteBoundingBox).filter(n => {
      const b = local(n);
      return close(b.x,before.x) && close(b.width,before.width) && close(b.height,before.height)
        && close(b.y+b.height,before.y) && a.x>=b.x-0.01 && a.y>=b.y-0.01
        && a.x+a.width<=b.x+b.width+0.01 && a.y+a.height<=b.y+b.height+0.01;
    });
    if (candidates.length > 1) throw new Error(`AMBIGUOUS_SOURCE_GEOMETRY: ${id}`);
    if (candidates.length === 1) sections.push({ id, nodeId:candidates[0].id, anchorNodeId:anchor.id, before, after:{...before,...local(candidates[0])} });
  }
  // Explicit source-node mapping handles shared sections whose positions belong to another state.
  // Only exact-size translations are allowed, calculated from retained frame-local node bounds.
  if (mappingFile) for (const entry of read(inside(ROOT,mappingFile))) {
    if (sections.some(s=>s.id===entry.id)) throw new Error('DUPLICATE_SOURCE_GEOMETRY_MAPPING');
    const before = originalGeometry(manifest,route,entry.id);
    const box = bounds(nodes,entry.nodeIds,origin);
    if (!close(before.width,box.width) || !close(before.height,box.height)) throw new Error('SOURCE_GEOMETRY_MAPPING_SIZE_MISMATCH');
    sections.push({id:entry.id,nodeIds:entry.nodeIds,before,after:{...before,...box}});
  }
  if (!sections.length) throw new Error('NO_PROVEN_GEOMETRY_CORRECTIONS');
  const correction = { id:route.id, frameNodeId:frame.id, referenceHash:digest(inside(SNAPSHOT,route.reference)),
    evidence:path.relative(ROOT,evidence).replaceAll('\\','/'), evidenceHash:digest(evidence), sections,
    reason:mappingFile ? 'Explicit same-sized section mapping to retained source nodes in this route frame.' : 'Unique source background absolute bounds prove a bottom-versus-top extraction error.' };
  const records = fs.existsSync(registry) ? read(registry) : { manifestHash:digest(manifestFile), routes:[] };
  resolveManifest();
  if (records.routes.some(r=>r.id===routeId)) throw new Error('SOURCE_GEOMETRY_ALREADY_RECONCILED');
  records.routes.push(correction);
  write(path.join(CACHE, `source-geometry-evidence-${Date.now()}.json`), correction);
  write(registry, records);
  console.log(JSON.stringify({route:routeId, corrections:sections}));
}
module.exports = { resolveManifest };
if (require.main === module) {
  try { if(process.argv[2]==='--ownership') reconcileOwnership(...process.argv.slice(3)); else reconcile(process.argv[2], process.argv[3], process.argv[4]); }
  catch(e) { console.error(e.message); process.exitCode=1; }
}
