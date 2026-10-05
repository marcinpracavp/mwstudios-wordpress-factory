const fs = require('fs');
const path = require('path');
const { read, write } = require('./common');
function ratio(summary) {
  const values = (summary.routes || []).flatMap(r => Object.entries(r.ownership || {})
    .filter(([k,v]) => !['outside','reused',...(r.skippedOwners || [])].includes(k) && v.pixels > 0)
    .map(([,v]) => v.layoutRatio ?? v.ratio));
  if (!values.length || values.some(v => !Number.isFinite(v))) throw Error('FINAL_PIXEL_EVIDENCE_MISSING');
  return Math.max(...values);
}
function smallFix(issue) {
  return /margin|padding|overflow|gap|line.height|border.radius/i.test(issue) &&
    !/missing|payment|order|taxonomy|product data|unavailable/i.test(issue);
}
async function run({ dir, comparison, binding, threshold = 0.04, invoke, reconcile, repair, capture, build }) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw Error('FINAL_THRESHOLD_INVALID');
  const file = path.join(dir, 'final-sol.json');
  let checkpoint = fs.existsSync(file) ? read(file) : null;
  const currentBinding = binding || comparison.sourceHash;
  if (!currentBinding) throw Error('FINAL_SOURCE_BINDING_REQUIRED');
  if (checkpoint && checkpoint.binding !== currentBinding) throw Error('FINAL_SOURCE_CHANGED: old Sol review cannot accept new source');
  if (checkpoint && checkpoint.threshold !== threshold) throw Error('FINAL_THRESHOLD_CHANGED: old Sol review cannot accept a new visual policy');
  if (!checkpoint) {
    checkpoint = { version:2, binding:currentBinding, threshold, status:'started', mode:ratio(comparison) > threshold ? 'pixel-perfect' : 'verification', startedAt:new Date().toISOString() };
    write(file,checkpoint);
    const result = await invoke(checkpoint.mode);
    checkpoint = { ...checkpoint, status:'reviewed', result }; write(file,checkpoint);
  } else if (checkpoint.status === 'started') {
    // Reconcile completed evidence, or resume the SAME interrupted model thread. Never create a second audit.
    const recovered = reconcile ? await reconcile(checkpoint.mode) : null;
    if (!recovered) throw Error('FINAL_SOL_INTERRUPTED: no resumable thread or completed evidence; duplicate audit prevented');
    checkpoint = { ...checkpoint, status:'reviewed', result:recovered }; write(file,checkpoint);
  }
  const result = checkpoint.result;
  if (!['passed','needs_work'].includes(result?.status)) throw Error(`FINAL_SOURCE_OR_STATE_BLOCKED: ${(result?.issues || []).join('; ')}`);
  if (result.status !== 'passed' && !(result.issues || []).length) throw Error('FINAL_AUDIT_MISSING_ACTIONABLE_ISSUES');
  for (const [i,issue] of (result.issues || []).entries()) {
    if (!smallFix(issue)) throw Error(`FINAL_MANUAL_REVIEW_REQUIRED: ${issue}`);
    await repair({ id:`final-luna-${i}`, class:'css-fix', type:'style-fix', onlyModel:'luna', issues:[issue], title:issue });
  }
  await build();
  const after = await capture();
  if (!after.passed || ratio(after) > threshold) throw Error('FINAL_MEASURED_CHECKS_FAILED: no READY status');
  checkpoint.status = 'complete'; checkpoint.finishedAt = new Date().toISOString(); checkpoint.after = after; write(file,checkpoint);
  return after;
}
module.exports = { run, ratio, smallFix };
