// Resolve the CURRENT checkout's LocalWP service; never reuse another site's DB configuration.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./common');
function resolve() {
  let root = ROOT;
  while (!fs.existsSync(path.join(root, 'wp-load.php'))) {
    const parent = path.dirname(root);
    if (parent === root) throw new Error('WordPress root not found in checkout ancestry');
    root = parent;
  }
  const local = path.join(process.env.APPDATA || '', 'Local');
  const registry = JSON.parse(fs.readFileSync(path.join(local, 'sites.json'), 'utf8'));
  const siteRoot = path.resolve(root, '../..');
  const site = Object.values(registry).find(s => s.path && path.resolve(s.path).toLowerCase() === siteRoot.toLowerCase());
  if (!site) throw new Error('Current site missing from LocalWP registry');
  const version = site.services?.php?.version || site.phpVersion;
  const services = path.join(local, 'lightning-services');
  const service = fs.readdirSync(services).find(n => n.startsWith(`php-${version}`));
  const php = process.env.FACTORY_PHP_PATH || (service && path.join(services, service, 'bin/win64/php.exe'));
  const ini = path.join(local, 'run', site.id, 'conf/php/php.ini');
  const phar = process.env.FACTORY_WP_CLI_PATH || [
    path.join(process.env.LOCALAPPDATA || '', 'Programs/Local/resources/extraResources/bin/wp-cli/wp-cli.phar'),
    path.join(process.env.ProgramFiles || '', 'Local/resources/extraResources/bin/wp-cli/wp-cli.phar')
  ].find(f => fs.existsSync(f));
  if (!php || !fs.existsSync(php) || !phar || !fs.existsSync(ini)) throw new Error('LocalWP PHP/ini/WP-CLI unavailable; start current site in LocalWP');
  return { root, php, args: ['-c', ini, '-d', 'display_errors=stderr', phar, `--path=${root}`], site: { id: site.id, name: site.name } };
}
function wp(args, options = {}) {
  const t = resolve();
  const result = spawnSync(t.php, [...t.args, ...args], { cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 180000, maxBuffer: 8 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
  return result.stdout.trim();
}
if (require.main === module) {
  try { console.log(process.argv.includes('--toolchain') ? JSON.stringify(resolve(), null, 2) : wp(process.argv.slice(2))); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { resolve, wp };
