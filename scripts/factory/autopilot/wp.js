// Resolve Docker tools or the CURRENT checkout's LocalWP service; never reuse another site's DB configuration.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, resolveRuntime, resolveWordPressRoot } = require('./common');
function resolve(env = process.env, dependencies = {}) {
  const io = dependencies.fs || fs;
  const spawn = dependencies.spawnSync || spawnSync;
  const root = resolveWordPressRoot(env, dependencies.root || ROOT, io);
  if (resolveRuntime(env) === 'docker') {
    if (!io.existsSync(path.join(root, 'wp-load.php'))) throw new Error(`Docker WordPress root unavailable: ${root}`);
    const found = env.FACTORY_WP_CLI_PATH || (() => {
      const result = spawn('which', ['wp'], { encoding: 'utf8', env });
      return result.status === 0 ? result.stdout.trim().split(/\r?\n/)[0] : null;
    })();
    try {
      if (!found || !io.statSync(found).isFile()) throw new Error();
      io.accessSync(found, fs.constants.X_OK);
    } catch { throw new Error('Docker WP-CLI unavailable; run .devcontainer/post-create.sh or set FACTORY_WP_CLI_PATH'); }
    return { mode: 'docker', root, executable: found, args: [`--path=${root}`] };
  }
  const local = path.join(env.APPDATA || '', 'Local');
  const registry = JSON.parse(io.readFileSync(path.join(local, 'sites.json'), 'utf8'));
  const siteRoot = path.resolve(root, '../..');
  const site = Object.values(registry).find(s => s.path && path.resolve(s.path).toLowerCase() === siteRoot.toLowerCase());
  if (!site) throw new Error('Current site missing from LocalWP registry');
  const version = site.services?.php?.version || site.phpVersion;
  const services = path.join(local, 'lightning-services');
  const service = io.readdirSync(services).find(n => n.startsWith(`php-${version}`));
  const php = env.FACTORY_PHP_PATH || (service && path.join(services, service, 'bin/win64/php.exe'));
  const ini = path.join(local, 'run', site.id, 'conf/php/php.ini');
  const phar = env.FACTORY_WP_CLI_PATH || [
    path.join(env.LOCALAPPDATA || '', 'Programs/Local/resources/extraResources/bin/wp-cli/wp-cli.phar'),
    path.join(env.ProgramFiles || '', 'Local/resources/extraResources/bin/wp-cli/wp-cli.phar')
  ].find(f => io.existsSync(f));
  if (!php || !io.existsSync(php) || !phar || !io.existsSync(ini)) throw new Error('LocalWP PHP/ini/WP-CLI unavailable; start current site in LocalWP');
  return { mode: 'localwp', executable: php, root, php, args: ['-c', ini, '-d', 'display_errors=stderr', phar, `--path=${root}`], site: { id: site.id, name: site.name } };
}
function wp(args, options = {}) {
  const env = { ...process.env, ...options.env };
  const t = resolve(env);
  const result = spawnSync(t.executable, [...t.args, ...args], { cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 180000, maxBuffer: 8 * 1024 * 1024, ...options, env });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
  return result.stdout.trim();
}
if (require.main === module) {
  try { console.log(process.argv.includes('--toolchain') ? JSON.stringify(resolve(), null, 2) : wp(process.argv.slice(2))); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { resolve, wp };
