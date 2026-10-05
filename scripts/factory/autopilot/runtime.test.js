const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveRuntime, resolveLocalUrl, resolveWordPressRoot, resolveWpContent } = require('./common');
const { resolve } = require('./wp');

test('runtime selection and URL override preserve LocalWP defaults', () => {
  const project = { environment: { localUrl: 'https://autopilot.local' } };
  assert.equal(resolveRuntime({}), 'localwp');
  assert.equal(resolveRuntime({ CODESPACES: 'true' }), 'docker');
  assert.equal(resolveRuntime({ CODESPACES: 'true', FACTORY_RUNTIME: 'localwp' }), 'localwp');
  assert.throws(() => resolveRuntime({ FACTORY_RUNTIME: 'typo' }), /Unsupported/);
  assert.equal(resolveLocalUrl(project, {}), 'https://autopilot.local');
  assert.equal(resolveLocalUrl(project, { FACTORY_LOCAL_URL: 'http://wordpress' }), 'http://wordpress');
});
test('Docker resolves executable and root without reading LocalWP registry', () => {
  const env = { FACTORY_RUNTIME: 'docker', FACTORY_WP_ROOT: '/wordpress' };
  const io = {
    existsSync: p => p === '/wordpress/wp-load.php',
    statSync: p => ({ isFile: () => p === '/usr/local/bin/wp' }),
    accessSync: () => {},
    readFileSync: () => assert.fail('Docker must not read LocalWP registry'),
  };
  const spawn = (file, args) => {
    assert.equal(file, 'which'); assert.deepEqual(args, ['wp']);
    return { status: 0, stdout: '/usr/local/bin/wp\n' };
  };
  const result = resolve(env, { fs: io, spawnSync: spawn });
  assert.equal(result.mode, 'docker');
  assert.equal(result.executable, '/usr/local/bin/wp');
  assert.deepEqual(result.args, ['--path=/wordpress']);
  assert.equal(resolveWordPressRoot(env), '/wordpress');
  assert.equal(resolveWpContent(env, '/workspace'), '/wordpress/wp-content');
  assert.throws(() => resolve(env, { fs: { ...io, accessSync() { throw Error(); } }, spawnSync: spawn }), /Docker WP-CLI unavailable/);
});
test('LocalWP retains checkout ancestry, registry, PHP version, ini and phar', () => {
  const root = path.resolve('/local/site/app/public');
  const checkout = path.join(root, 'wp-content/themes/theme');
  const env = { FACTORY_RUNTIME: 'localwp', APPDATA: '/appdata', LOCALAPPDATA: '/localappdata' };
  const io = {
    existsSync: p => p === path.join(root, 'wp-load.php') || /php\.exe$|php\.ini$|wp-cli\.phar$/.test(p),
    readFileSync: p => {
      assert.equal(p, path.join('/appdata', 'Local/sites.json'));
      return JSON.stringify({ site: { id: 'current', path: path.resolve(root, '../..'), services: { php: { version: '8.2' } } } });
    },
    readdirSync: () => ['php-8.2.0'],
  };
  const result = resolve(env, { root: checkout, fs: io });
  assert.equal(result.mode, 'localwp');
  assert.equal(result.root, root);
  assert.equal(result.php, path.join('/appdata', 'Local/lightning-services/php-8.2.0/bin/win64/php.exe'));
  assert.deepEqual(result.args, ['-c', path.join('/appdata', 'Local/run/current/conf/php/php.ini'), '-d', 'display_errors=stderr', path.join('/localappdata', 'Programs/Local/resources/extraResources/bin/wp-cli/wp-cli.phar'), `--path=${root}`]);
  assert.equal(resolveWpContent(env, checkout), path.join(root, 'wp-content'));
});
test('Docker wp wrapper forwards eval-file and caller environment', { skip: process.platform === 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-runtime-'));
  try {
    fs.writeFileSync(path.join(dir, 'wp-load.php'), '');
    let invocation;
    const output=require('./wp').wp(['eval-file','probe.php'],{
      env:{FACTORY_RUNTIME:'docker',FACTORY_WP_ROOT:dir,FACTORY_WP_CLI_PATH:'/bin/echo',FACTORY_TEST_VALUE:'preserved'},
      spawnSync:(file,args,options)=>{invocation={file,args,env:options.env};return {status:0,stdout:'verified\n',stderr:''};},
    });
    assert.equal(output,'verified');
    assert.equal(invocation.file,'/bin/echo');
    assert.deepEqual(invocation.args,[`--path=${dir}`,'eval-file','probe.php']);
    assert.equal(invocation.env.FACTORY_TEST_VALUE,'preserved');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('browser discovery honors explicit path then managed Chromium and rejects non-executables', { skip: process.platform === 'win32' }, t => {
  const cp = require('child_process');
  const chromium = require('playwright-core').chromium;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-browser-'));
  const previous = process.env.FACTORY_BROWSER_PATH;
  const modulePath = require.resolve('../qa/browser');
  try {
    const managed = path.join(dir, 'chromium');
    const explicit = path.join(dir, 'explicit');
    fs.writeFileSync(managed, '', { mode: 0o755 });
    fs.writeFileSync(explicit, '', { mode: 0o755 });
    t.mock.method(cp, 'spawnSync', () => ({ status: 1, stdout: '' }));
    t.mock.method(chromium, 'executablePath', () => managed);
    delete require.cache[modulePath];
    const { discoverBrowser } = require('../qa/browser');
    process.env.FACTORY_BROWSER_PATH = explicit;
    assert.equal(discoverBrowser().browser.executablePath, explicit);
    fs.chmodSync(explicit, 0o644);
    assert.equal(discoverBrowser().browser.executablePath, managed);
    fs.chmodSync(managed, 0o644);
    assert.equal(discoverBrowser().browser, null);
    fs.unlinkSync(managed);
    assert.equal(discoverBrowser().browser, null);
  } finally {
    if (previous === undefined) delete process.env.FACTORY_BROWSER_PATH;
    else process.env.FACTORY_BROWSER_PATH = previous;
    delete require.cache[modulePath];
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
