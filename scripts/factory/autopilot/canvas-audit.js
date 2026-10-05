// Guard against Figma layers whose z-order does not match their canvas position.
// Discovery records immediate frame children; this keeps that review durable
// without retaining raw MCP payloads.
const fs = require('fs');
const path = require('path');
const { SNAPSHOT, read, inside } = require('./common');
function version(value) {
  const [major = 0, minor = 0] = String(value || '0.0').split('.').map(Number);
  return { major, minor };
}

function required(manifest, minimumVersion = manifest.snapshotVersion) {
  const { major, minor } = version(minimumVersion);
  return major > 1 || (major === 1 && minor >= 1);
}

// Canvas ownership is source evidence too. A section snapshot that explicitly
// says that its subtree has no text conflicts with an owned visible TEXT node
// in the full-frame canvas audit. Such a contradiction used to let an
// image-only subsection hide the article copy that was visibly present in
// Figma. Return compact facts so the canvas backfill task can repair the
// source snapshot rather than papering over the resulting page-height delta.
function contradictions(manifest, snapshot = SNAPSHOT) {
  const sections = new Map((manifest.sections || []).map(section => [section.id, section]));
  const facts = [];
  for (const audit of manifest.canvasAudit || []) for (const node of audit.nodes || []) {
    if (!node.visible || node.role !== 'section' || node.type !== 'TEXT' || !node.sectionId) continue;
    const section = sections.get(node.sectionId);
    if (!section?.snapshot) continue;
    let source;
    try {
      const file = inside(snapshot, section.snapshot);
      if (!fs.existsSync(file)) continue;
      source = read(file);
    } catch { continue; }
    const notes = (source.notes || []).join(' ');
    const deniesText = /(?:no|without) (?:native |editable )?text|(?:no|without) .*text.*(?:content|layer|field)|graphics-only/i.test(notes);
    // Small labels/icons are often deliberately owned by the nearest visual
    // cluster. Escalate only a substantive text block: one capable of
    // changing page composition if it is omitted from the snapshot.
    const sourceHeight = Number(source.desktop?.height) || 0;
    const substantive = node.height >= Math.max(160, sourceHeight * 0.5) || String(node.name || '').length >= 500;
    if (!deniesText || !substantive) continue;
    facts.push({ routeFrameNodeId: audit.frameNodeId, sectionId: node.sectionId, snapshot: section.snapshot,
      nodeId: node.nodeId, name: node.name, x: node.x, y: node.y, width: node.width, height: node.height,
      reason: 'visible canvas text contradicts the section snapshot claim that no text exists' });
  }
  return facts;
}

// Semantic bounds must contain every visible canvas node assigned to the
// section. Otherwise discovery has described a fragment (often an image crop)
// while omitting or separating its source-backed copy, CTA or repeated items.
function topologyContradictions(manifest, snapshot = SNAPSHOT, tolerance = 2) {
  const facts=[];
  for(const route of manifest.routes || []) {
    const audit=(manifest.canvasAudit || []).find(entry=>entry.frameNodeId===route.frameNodeId);
    if(!audit)continue;
    for(const id of route.sections || []) {
      const groups=new Set((manifest.routes || []).filter(item=>item.sections?.includes(id)).map(item=>item.buildGroup));
      if(groups.size>1)continue; // Shared chrome has route-local placement.
      const section=(manifest.sections || []).find(item=>item.id===id);
      if(!section?.snapshot)continue;
      let source;
      try { source=read(inside(snapshot,section.snapshot)); } catch { continue; }
      const box=route.sectionGeometry?.[id] || source.desktop;
      if(!box || ![box.x,box.y,box.width,box.height].every(Number.isFinite))continue;
      const nodes=(audit.nodes || []).filter(node=>node.visible&&node.role==='section'&&node.sectionId===id);
      const outsideNodes=[];
      for(const node of nodes) {
        const outside=node.x<box.x-tolerance||node.y<box.y-tolerance||node.x+node.width>box.x+box.width+tolerance||node.y+node.height>box.y+box.height+tolerance;
        if(!outside)continue;
        outsideNodes.push({nodeId:node.nodeId,name:node.name,type:node.type,x:node.x,y:node.y,width:node.width,height:node.height});
      }
      if(outsideNodes.length)facts.push({routeId:route.id,routeFrameNodeId:route.frameNodeId,sectionId:id,snapshot:section.snapshot,
        outsideNodes,sectionBounds:box,reason:'visible canvas nodes assigned to the section fall outside its recorded semantic bounds'});
    }
  }
  return facts;
}

function validate(manifest, minimumVersion, snapshot = SNAPSHOT) {
  if (!required(manifest, minimumVersion)) return [];
  const errors = [], routes = manifest.routes || [];
  const sectionIds = new Set((manifest.sections || []).map(section => section.id));
  const audits = manifest.canvasAudit || [];
  for (const route of routes) {
    const audit = audits.find(entry => entry.frameNodeId === route.frameNodeId);
    if (!audit) { errors.push(`Missing canvas audit for route ${route.id}`); continue; }
    const ids = new Set();
    if (!audit.nodes?.length) { errors.push(`Empty canvas audit for route ${route.id}`); continue; }
    for (const node of audit.nodes) {
      if (ids.has(node.nodeId)) errors.push(`Duplicate canvas node ${route.id}/${node.nodeId}`);
      ids.add(node.nodeId);
      if (node.visible && node.role === 'unassigned') errors.push(`Unassigned visible canvas node ${route.id}/${node.nodeId}`);
      if (node.role === 'section') {
        if (!sectionIds.has(node.sectionId)) errors.push(`Unknown canvas section ${route.id}/${node.sectionId}`);
        else if (!route.sections.includes(node.sectionId)) errors.push(`Canvas section omitted from route ${route.id}/${node.sectionId}`);
      }
    }
  }
  for (const conflict of contradictions(manifest, snapshot)) {
    errors.push(`Canvas/source contradiction ${conflict.sectionId}/${conflict.nodeId}: ${conflict.reason}`);
  }
  for (const conflict of topologyContradictions(manifest, snapshot)) {
    errors.push(`Canvas/section topology contradiction ${conflict.routeId}/${conflict.sectionId}: ${conflict.reason} (${conflict.outsideNodes.length} nodes)`);
  }
  return errors;
}

module.exports = { required, contradictions, topologyContradictions, validate };
