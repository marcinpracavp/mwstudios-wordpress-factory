/**
 * Project adapter populated after the frozen source plan exists.
 * Missing mappings fail closed and can never produce a synthetic PASS.
 */
async function verifyBatch({ keys = [] } = {}) {
  return {
    readOnly: true,
    records: keys.map(key => ({
      key,
      passed: false,
      observed: { reason: 'PROJECT_NATIVE_BATCH_ADAPTER_NOT_CONFIGURED' },
    })),
  };
}

module.exports = { verifyBatch };
