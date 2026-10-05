const fs = require('fs');
const path = require('path');
const { ROOT, CACHE, read, inside } = require('./common');

function progress(current, summary, policy) {
  const candidates = [];
  for (const entry of fs.readdirSync(CACHE, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('visual-')) continue;
    const file = path.join(CACHE, entry.name, 'summary.json');
    if (!fs.existsSync(file)) continue;
    try {
      const s = read(file), route = s.routes.find(r => r.id === current.id);
      if (!route || s.sourceHash !== summary.sourceHash || JSON.stringify(s.thresholds) !== JSON.stringify(summary.thresholds)) continue;
      const c = read(inside(ROOT, route.comparison));
      if (c.measurementVersion !== current.measurementVersion || c.acceptanceScope !== current.acceptanceScope || c.geometryHash !== current.geometryHash) continue;
      if (c.reference?.sha256 !== current.reference?.sha256 || !Number.isFinite(c.pixels?.ownership?.page?.ratio)) continue;
      candidates.push({ file, implementationHash: s.implementationHash, capturedAt: c.capturedAt, ratio: c.pixels.ownership.page.ratio });
    } catch { /* Incomplete captures do not constitute history. */ }
  }
  candidates.push({ file: 'current capture', implementationHash: summary.implementationHash, capturedAt: current.capturedAt, ratio: current.pixels.ownership.page.ratio });
  candidates.sort((a,b) => b.capturedAt.localeCompare(a.capturedAt));
  const seen = new Set();
  const samples = candidates.filter(c => { if(seen.has(c.implementationHash)) return false; seen.add(c.implementationHash); return true; }).slice(0,policy.samples);
  const improvement = samples.length ? Math.max(...samples.map(s=>s.ratio))-Math.min(...samples.map(s=>s.ratio)) : null;
  const nonPixelErrors = current.acceptance.pageErrors.filter(e => !e.startsWith('page pixel mismatch'));
  return { deferred: samples.length === policy.samples && samples.every(s=>s.ratio <= policy.maxPageMismatch) && improvement < policy.minImprovement && nonPixelErrors.length === 0,
    samples, improvement, policy, nonPixelErrors, reason: 'Insufficient measured progress across distinct implementations; unresolved visual work belongs to final audit, not PASS.' };
}
module.exports = { progress };
