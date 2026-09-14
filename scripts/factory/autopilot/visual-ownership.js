// Ownership is implementation metadata, separate from immutable Figma source facts.
function sectionOwnership(manifest, id, observed) {
  const tokens = id.toLowerCase().split(/[-_]/);
  if (observed?.landmark === 'footer' || tokens.includes('footer')) return { owner: 'footer', component: 'footer' };
  if (observed?.landmark === 'header' || tokens.some(t => ['header', 'topbar', 'navigation'].includes(t))) return { owner: 'header', component: 'header' };
  const groups = new Set(manifest.routes.filter(r => r.sections.includes(id)).map(r => r.buildGroup));
  if (observed?.component || groups.size > 1) return { owner: 'shared', component: observed?.component || id };
  return { owner: 'page', component: null };
}

function acceptance(result, config, runtimeErrors, skippedOwners = []) {
  if (!result.pixels?.ownership) throw new Error('MISSING_VISUAL_OWNERSHIP');
  const groups = result.pixels.ownership;
  const pageErrors = [...runtimeErrors], sharedErrors = [];
  if (groups.page.pixels === 0) pageErrors.push('No page pixels measured');
  for (const [owner, measurement] of Object.entries(groups)) {
    if (['outside','reused'].includes(owner) || skippedOwners.includes(owner)) continue;
    if (measurement.pixels && measurement.ratio > config.maxDifferentPixelRatio) {
      (owner === 'page' ? pageErrors : sharedErrors).push(`${owner} pixel mismatch ${(measurement.ratio * 100).toFixed(3)}%`);
    }
  }
  for (const [id, measurement] of Object.entries(result.pixels.components || {})) {
    if (measurement.owner === 'shared' && measurement.ratio > config.maxDifferentPixelRatio) sharedErrors.push(`Shared component pixel mismatch ${id}: ${(measurement.ratio * 100).toFixed(3)}%`);
  }
  for (const section of result.geometry) {
    if (skippedOwners.includes(section.owner)) continue;
    if (!section.passed) (section.owner === 'page' ? pageErrors : sharedErrors).push(`Section geometry differs: ${section.id}`);
  }
  return { threshold: config.maxDifferentPixelRatio, pagePassed: pageErrors.length === 0,
    sharedPassed: skippedOwners.length ? null : sharedErrors.length === 0, pageErrors, sharedErrors, skippedOwners,
    note: 'Page build readiness can defer shared visual issues. Final acceptance requires both plus independent visual audit. Section ratios remain diagnostics.' };
}
module.exports = { sectionOwnership, acceptance };
