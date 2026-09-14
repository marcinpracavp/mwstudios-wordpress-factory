// Missing real business inputs are carried to human review, never converted to visual PASS.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, inside, read, hash } = require('./common');

function dependencies(result, routes) {
  const accepted = [];
  for (const file of result?.evidence || []) {
    if (!file.endsWith('.source-dependency.json')) continue;
    const document = read(inside(ROOT,file));
    const route=routes.find(r=>r.id===document.routeId);
    const policy=read(path.join(ROOT,'factory/autopilot.json')).contentPolicy;
    // The user's revised policy authorizes importing source reviews into native WooCommerce.
    // Historical "no native reviews" declarations no longer block this implementation task.
    if(policy?.importFigmaReviews && /review/i.test(route?.state || route?.id || '')) continue;
    if (document.version!==1 || document.kind!=='missing-source-input'
      || !routes.some(r=>r.id===document.routeId) || typeof document.missingInput!=='string' || !document.missingInput.trim()
      || typeof document.reason!=='string' || !document.reason.trim()
      || !document.sourceEvidence?.length || !document.runtimeEvidence?.length) throw new Error('INVALID_SOURCE_DEPENDENCY');
    const evidence = [];
    for (const [kind, files] of [['source',document.sourceEvidence],['runtime',document.runtimeEvidence]]) {
      for (const entry of files) {
        const target = inside(ROOT,entry);
        if (kind==='source') inside(SNAPSHOT,target);
        if (!fs.statSync(target).isFile()) throw new Error('SOURCE_DEPENDENCY_EVIDENCE_NOT_FILE');
        evidence.push({kind,path:entry,sha256:hash(fs.readFileSync(target))});
      }
    }
    accepted.push({...document, declaration:file, evidence, status:'requires_source_input', visualPassed:false});
  }
  return accepted;
}

function carryable(summary, dependency) {
  if (!dependency || summary.routes.length!==1 || summary.routes[0].id!==dependency.routeId) return false;
  const comparison = read(inside(ROOT,summary.routes[0].comparison));
  if (!comparison.acceptance || !comparison.geometry?.length || !comparison.pixels?.ownership?.page?.pixels) return false;
  const runtimeErrors = comparison.acceptance.pageErrors.filter(e=>!e.startsWith('page pixel mismatch')&&!e.startsWith('Section geometry differs:'));
  return runtimeErrors.length===0 && comparison.responsive.every(r=>r.renderHealthy);
}
module.exports = { dependencies, carryable };
