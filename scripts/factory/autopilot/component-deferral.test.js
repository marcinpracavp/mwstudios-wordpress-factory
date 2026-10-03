const test = require('node:test');
const assert = require('node:assert/strict');
const { decide } = require('./component-deferral');
const { healthyCapture } = require('./component-deferral');
const { isInvalidSourceCrop } = require('./component-visual');
const capture = ratio => ({ errors: [], sections: [{ geometryPassed: true, imagesHealthy: true, pixels: { ratio } }] });

test('a healthy component that reaches the ceiling after repair is deferred', () => {
  const result = decide([capture(0.1644), capture(0.0899)], { samples: 2, maxPageMismatch: 0.13, minImprovement: 0.03 });
  assert.equal(result.last, 0.0899); assert.equal(result.materiallyImproved, true);
});

test('an invalid source crop is deferred instead of being retried as a component defect', () => {
  assert.equal(isInvalidSourceCrop(Error('INVALID_SOURCE_CROP')), true);
  assert.equal(isInvalidSourceCrop(Error('ROUTE_HTTP_404')), false);
});

test('a healthy capture may retain a high pixel mismatch for final audit', () => {
  assert.equal(healthyCapture(capture(0.1427)), true);
  assert.equal(healthyCapture({ errors: [], sections: [{ geometryPassed: false, imagesHealthy: true, semantic: { passed: true } }] }), false);
});
test('deferral never accepts an unhealthy capture or a result above its ceiling', () => {
  assert.equal(decide([capture(0.16), capture(0.14)], { samples: 2, maxPageMismatch: 0.13 }), null);
  assert.equal(decide([{ errors: ['HTTP 500'], sections: [] }, capture(0.08)], { samples: 2, maxPageMismatch: 0.13 }), null);
});
