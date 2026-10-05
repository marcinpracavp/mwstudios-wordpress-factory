/**
 * Project-specific browser preparation hook.
 *
 * Canonical routes require no preparation. A discovered interaction state
 * must replace this guard with idempotent actions on real UI controls and
 * real imported data. Never inject screenshot-only DOM or transactions.
 */
async function prepare({ route }) {
  if (route?.state) {
    throw new Error(`PROJECT_STATE_ADAPTER_NOT_CONFIGURED: ${route.id}`);
  }
}

module.exports = { prepare };
