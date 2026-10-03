const path = require('path');
const { ROOT, read, resolveRuntime } = require('./autopilot/common');
const { resolve, wp } = require('./autopilot/wp');

function bootstrap() {
  if (resolveRuntime() !== 'docker') throw new Error('DOCKER_RUNTIME_REQUIRED: refusing to change LocalWP');
  const toolchain = resolve();
  wp(['core', 'is-installed']); // Includes a real DB connection; never install/reset WordPress here.
  wp(['option', 'update', 'home', 'http://wordpress']);
  wp(['option', 'update', 'siteurl', 'http://wordpress']);
  const project = read(path.join(ROOT, 'factory/project.json'));
  const enabled = new Set(project.capabilities.enabled);
  const plugins = JSON.parse(wp(['plugin', 'list', '--format=json']));
  const ensure = (slug, privatePlugin = false) => {
    const plugin = plugins.find(item => item.name === slug);
    if (!plugin) {
      if (privatePlugin) throw new Error('ACF_PRO_MISSING: install your licensed ACF Pro, then rerun bootstrap');
      wp(['plugin', 'install', slug, '--activate']);
    } else if (!['active', 'active-network'].includes(plugin.status)) {
      wp(['plugin', 'activate', slug]);
    }
  };
  // Verify the private dependency before installing any public dependencies.
  if (enabled.has('acf')) ensure('advanced-custom-fields-pro', true);
  for (const [capability, slug] of [['woocommerce', 'woocommerce'], ['cf7', 'contact-form-7'], ['polylang', 'polylang']]) {
    if (enabled.has(capability)) ensure(slug);
  }
  if (enabled.has('acf')) wp(['eval', 'if (!function_exists("acf_get_setting") || !acf_get_setting("pro")) { WP_CLI::error("ACF_PRO_MISSING"); }']);
  if (wp(['option', 'get', 'home']) !== 'http://wordpress' || wp(['option', 'get', 'siteurl']) !== 'http://wordpress') {
    throw new Error('DOCKER_URL_MISMATCH: check wp-config CLI URL overrides');
  }
  console.log(`Codespaces bootstrap: PASS (${toolchain.root}, http://wordpress)`);
}
if (require.main === module) {
  try { bootstrap(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { bootstrap };
