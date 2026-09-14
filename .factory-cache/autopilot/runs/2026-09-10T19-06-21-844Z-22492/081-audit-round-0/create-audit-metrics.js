const fs = require('fs');
const path = require('path');
const comparisonRoot = path.resolve(__dirname, '../comparison-1789346670154');
const summary = JSON.parse(fs.readFileSync(path.join(comparisonRoot, 'summary.json'), 'utf8'));
const pct = value => Number((Number(value || 0) * 100).toFixed(3));
const routes = summary.routes.map(({ id }) => {
  const d = JSON.parse(fs.readFileSync(path.join(comparisonRoot, id, 'comparison.json'), 'utf8'));
  return {id,passed:d.passed,fullRatioPercent:pct(d.pixels.ratio),ownership:Object.fromEntries(Object.entries(d.pixels.ownership||{}).map(([k,v])=>[k,pct(v.ratio)])),reference:d.reference,rendered:d.rendered,heightDelta:Number(d.rendered.height)-Number(d.reference.height),errors:d.errors,unhealthyResponsiveWidths:(d.responsive||[]).filter(x=>!x.renderHealthy).map(x=>x.width),geometryFailures:(d.geometry||[]).filter(x=>!x.passed).map(x=>({section:x.id,expected:x.expected||null,actual:x.actual||null,delta:x.delta||null})),crops:(d.pixels.crops||[]).map(x=>({id:x.id,owner:x.owner,ratioPercent:pct(x.ratio)}))};
});
const out={capturedAt:summary.capturedAt,implementationHash:summary.implementationHash,sourceHash:summary.sourceHash,thresholdPercent:pct(summary.thresholds.maxDifferentPixelRatio),geometryTolerancePx:summary.thresholds.geometryTolerancePx,buildReady:summary.buildReady,passed:summary.passed,deferred:summary.deferred,routeCount:routes.length,routes};
fs.writeFileSync(path.join(__dirname,'audit-metrics.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({routes:routes.length,failed:routes.filter(x=>!x.passed).length,output:path.join(__dirname,'audit-metrics.json')}));
