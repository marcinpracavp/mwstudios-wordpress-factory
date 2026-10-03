const fs = require('fs');
const { inside } = require('./common');
// Normalize citations only when their exact path exists. Never manufacture a proof file.
function normalize(result, root) {
  if (!Array.isArray(result.evidence)) return { result, changes: [] };
  const changes = [], evidence = [];
  for (const original of result.evidence) {
    if (typeof original !== 'string') { evidence.push(original); continue; }
    const text = original.trim();
    const exists = p => { try { return fs.statSync(inside(root, p)).isFile(); } catch { return false; } };
    if (exists(text)) { evidence.push(text); continue; }
    // Figma recovery records live under the frozen snapshot. Workers may
    // cite the snapshot-relative observations/ path; resolve it only when
    // that exact immutable file exists, never by creating a replacement.
    if (text.startsWith('observations/')) {
      const snapshotPath = `.factory-cache/figma/latest/${text}`;
      if (exists(snapshotPath)) {
        evidence.push(snapshotPath);
        changes.push({ original, path: snapshotPath, reason: 'resolved snapshot-relative Figma observation' });
        continue;
      }
    }
    const cited = text.match(/^(.+?\.(?:jsonl?|md|txt|log|png|svg|php|scss|css|js|html))(?=:\s|\s[—-]\s)/i)?.[1];
    if (cited && exists(cited)) { evidence.push(cited); changes.push({ original, path: cited, reason: 'existing file citation suffix removed' }); }
    else evidence.push(text); // Unsupported commands/absent files still fail validation.
  }
  return { result: { ...result, evidence: [...new Set(evidence)] }, changes };
}
module.exports = { normalize };
