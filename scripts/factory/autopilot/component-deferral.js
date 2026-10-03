// Bounded local visual deferral. This is not acceptance: the complete route
// is still checked in the final page audit.
function healthyCapture(measurement) {
  return measurement?.errors?.length === 0 && measurement.sections?.length > 0
    && measurement.sections.every(section => section.geometryPassed && section.imagesHealthy && section.semantic?.passed !== false);
}
function decide(measurements, policy = {}) {
  const requiredSamples = Math.max(2, Number.isInteger(policy.samples) ? policy.samples : 2);
  const ceiling = policy.maxPageMismatch;
  if (!Number.isFinite(ceiling) || !Array.isArray(measurements) || !measurements.length) return null;
  const latest = measurements.at(-1);
  const latestHealthy = healthyCapture(latest);
  if (!latestHealthy) return null;
  const healthy = measurements.flatMap(measurement => measurement.sections || [])
    .filter(section => section.geometryPassed && section.imagesHealthy && Number.isFinite(section.pixels?.ratio));
  const samples = healthy.slice(-requiredSamples);
  if (samples.length !== requiredSamples) return null;
  const last = samples.at(-1).pixels.ratio;
  // A component that reaches the controlled ceiling after bounded repair is
  // valuable progress. Its earlier, worse capture is evidence for final QA,
  // not a reason to consume another stage attempt.
  if (last > ceiling) return null;
  const first = samples[0].pixels.ratio;
  const improvement = first - last;
  return { samples, last, improvement, materiallyImproved: improvement >= (policy.minImprovement || 0) };
}
module.exports = { decide, healthyCapture };
