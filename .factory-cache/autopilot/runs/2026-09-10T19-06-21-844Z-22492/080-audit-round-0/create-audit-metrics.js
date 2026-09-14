const fs = require('fs');
const path = require('path');

const comparisonRoot = path.resolve(__dirname, '../comparison-1789330359034');
const summary = JSON.parse(fs.readFileSync(path.join(comparisonRoot, 'summary.json'), 'utf8'));
const percent = (value) => Number((Number(value || 0) * 100).toFixed(3));
const routes = summary.routes.map((route) => {
  const detail = JSON.parse(fs.readFileSync(path.join(comparisonRoot, route.id, 'comparison.json'), 'utf8'));
  return {
    id: route.id,
    passed: detail.passed,
    fullRatioPercent: percent(detail.pixels.ratio),
    ownership: Object.fromEntries(Object.entries(detail.pixels.ownership || {}).map(([key, value]) => [key, percent(value.ratio)])),
    reference: detail.reference,
    rendered: detail.rendered,
    heightDelta: Number(detail.rendered.height) - Number(detail.reference.height),
    errors: detail.errors,
    unhealthyResponsiveWidths: (detail.responsive || []).filter((item) => !item.renderHealthy).map((item) => item.width),
    geometryFailures: (detail.geometry || []).filter((item) => !item.passed).map((item) => ({ section: item.id, expected: item.expected || null, actual: item.actual || null, delta: item.delta || null })),
    crops: (detail.pixels.crops || []).map((crop) => ({ id: crop.id, owner: crop.owner, ratioPercent: percent(crop.ratio) })),
    evidence: {
      comparison: `.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/comparison-1789330359034/${route.id}/comparison.json`,
      rendered: detail.rendered.path,
      diff: `.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/comparison-1789330359034/${route.id}/diff.png`,
      fullSheet: `.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/080-audit-round-0/visual-sheets/full-${route.id}.png`,
      sectionSheet: `.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/080-audit-round-0/visual-sheets/sections-${route.id}.png`,
      responsiveSheet: `.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/080-audit-round-0/visual-sheets/responsive-${route.id}.png`
    }
  };
});
const output = {
  capturedAt: summary.capturedAt,
  implementationHash: summary.implementationHash,
  sourceHash: summary.sourceHash,
  thresholdPercent: percent(summary.thresholds.maxDifferentPixelRatio),
  geometryTolerancePx: summary.thresholds.geometryTolerancePx,
  buildReady: summary.buildReady,
  passed: summary.passed,
  deferred: summary.deferred,
  routeCount: routes.length,
  routes
};
fs.writeFileSync(path.join(__dirname, 'audit-metrics.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ routes: routes.length, failed: routes.filter((route) => !route.passed).length, output: path.join(__dirname, 'audit-metrics.json') }));
