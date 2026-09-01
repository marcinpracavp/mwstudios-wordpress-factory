const fs = require('fs');
const path = require('path');

const { resolveCommand } = require('./agents/command-runner');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function existingFile(candidate) {
  return typeof candidate === 'string'
    && candidate.trim() !== ''
    && fs.existsSync(candidate)
    && fs.statSync(candidate).isFile()
    ? path.resolve(candidate)
    : null;
}

function validWordPressRoot(candidate) {
  return typeof candidate === 'string'
    && fs.existsSync(path.join(candidate, 'wp-load.php'))
    && fs.existsSync(path.join(candidate, 'wp-content'))
    ? path.resolve(candidate)
    : null;
}

function findWordPressRoot(startPath = ROOT_DIR, environment = process.env) {
  const explicit = validWordPressRoot(environment.FACTORY_WORDPRESS_ROOT);
  if (explicit) {
    return { path: explicit, source: 'FACTORY_WORDPRESS_ROOT' };
  }
  let current = path.resolve(startPath);
  while (true) {
    const found = validWordPressRoot(current);
    if (found) {
      return { path: found, source: 'project ancestry' };
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return { path: null, source: 'unavailable' };
    }
    current = parent;
  }
}

function siteRootFromWordPress(wordpressRoot) {
  if (!wordpressRoot) {
    return null;
  }
  const publicParent = path.dirname(wordpressRoot);
  return path.basename(publicParent).toLowerCase() === 'app'
    ? path.dirname(publicParent)
    : null;
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function localDataRoot(environment) {
  return environment.APPDATA ? path.join(environment.APPDATA, 'Local') : null;
}

function readLocalSiteRegistry(environment = process.env) {
  const root = localDataRoot(environment);
  const registryPath = root && path.join(root, 'sites.json');
  const registry = registryPath && fs.existsSync(registryPath) ? safeReadJson(registryPath) : null;
  if (!registry || typeof registry !== 'object') {
    return { path: registryPath, sites: [] };
  }
  return {
    path: registryPath,
    sites: Array.isArray(registry) ? registry : Object.values(registry)
  };
}

function resolveLocalSite(wordpressRoot, environment = process.env) {
  const siteRoot = siteRootFromWordPress(wordpressRoot);
  const normalizedRoot = siteRoot ? path.resolve(siteRoot).toLowerCase() : null;
  const localSitePath = siteRoot && path.join(siteRoot, 'local-site.json');
  const localSite = localSitePath && fs.existsSync(localSitePath) ? safeReadJson(localSitePath) : null;
  if (localSite && localSite.path
    && path.resolve(localSite.path).toLowerCase() === normalizedRoot) {
    return { site: localSite, source: localSitePath, siteRoot };
  }
  const registry = readLocalSiteRegistry(environment);
  const registrySite = registry.sites.find((site) => site.path
    && path.resolve(site.path).toLowerCase() === normalizedRoot);
  if (registrySite) {
    return { site: registrySite, source: registry.path, siteRoot };
  }
  return { site: null, source: null, siteRoot };
}

function localServiceRoots(environment = process.env) {
  const root = localDataRoot(environment);
  return [root && path.join(root, 'lightning-services')].filter(Boolean);
}

function localApplicationRoots(environment = process.env) {
  return [
    environment.LOCALAPPDATA && path.join(environment.LOCALAPPDATA, 'Programs', 'Local'),
    environment.ProgramFiles && path.join(environment.ProgramFiles, 'Local'),
    environment['ProgramFiles(x86)'] && path.join(environment['ProgramFiles(x86)'], 'Local')
  ].filter((candidate) => candidate && fs.existsSync(candidate));
}

function phpExecutableInService(servicePath) {
  const candidates = process.platform === 'win32'
    ? [
      path.join(servicePath, 'bin', 'win64', 'php.exe'),
      path.join(servicePath, 'bin', 'win32', 'php.exe'),
      path.join(servicePath, 'bin', 'php.exe')
    ]
    : [path.join(servicePath, 'bin', 'php')];
  return candidates.map(existingFile).find(Boolean) || null;
}

function findLocalPhp(site, environment = process.env) {
  const version = site && site.services && site.services.php
    ? site.services.php.version
    : site && site.phpVersion;
  for (const serviceRoot of localServiceRoots(environment)) {
    if (!fs.existsSync(serviceRoot)) {
      continue;
    }
    const directories = fs.readdirSync(serviceRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('php-'))
      .map((entry) => path.join(serviceRoot, entry.name));
    const ordered = version
      ? [
        ...directories.filter((directory) => path.basename(directory).startsWith(`php-${version}`)),
        ...directories.filter((directory) => !path.basename(directory).startsWith(`php-${version}`))
      ]
      : directories.reverse();
    for (const directory of ordered) {
      const executable = phpExecutableInService(directory);
      if (executable) {
        const dataRoot = localDataRoot(environment);
        const phpIni = site && site.id && dataRoot
          ? existingFile(path.join(dataRoot, 'run', site.id, 'conf', 'php', 'php.ini'))
          : null;
        return {
          executable,
          phpIni,
          source: version && path.basename(directory).startsWith(`php-${version}`)
            ? 'LocalWP site service'
            : 'LocalWP installed service'
        };
      }
    }
  }
  return null;
}

function resolvePhp({ wordpressRoot, environment = process.env } = {}) {
  const explicit = existingFile(environment.FACTORY_PHP_PATH);
  if (explicit) {
    return { available: true, command: explicit, argsPrefix: [], source: 'FACTORY_PHP_PATH' };
  }
  const pathCommand = resolveCommand(process.platform === 'win32' ? 'php.exe' : 'php');
  if (pathCommand) {
    return {
      available: true,
      command: pathCommand.command,
      argsPrefix: pathCommand.argsPrefix,
      source: 'PATH'
    };
  }
  const localSite = resolveLocalSite(wordpressRoot, environment);
  const localPhp = findLocalPhp(localSite.site, environment);
  return localPhp
    ? {
      available: true,
      command: localPhp.executable,
      argsPrefix: localPhp.phpIni ? ['-c', localPhp.phpIni] : [],
      phpIni: localPhp.phpIni,
      source: localPhp.source
    }
    : { available: false, command: null, argsPrefix: [], source: 'unavailable' };
}

function wpInvocationFromPath(candidate, php, source) {
  const filePath = existingFile(candidate);
  if (!filePath) {
    return null;
  }
  if (/\.phar$/i.test(filePath)) {
    if (!php.available) {
      return null;
    }
    return {
      available: true,
      command: php.command,
      argsPrefix: [...php.argsPrefix, filePath],
      source,
      display: [php.command, ...php.argsPrefix, filePath].join(' ')
    };
  }
  const resolved = resolveCommand(filePath);
  return resolved ? {
    available: true,
    command: resolved.command,
    argsPrefix: resolved.argsPrefix,
    source,
    display: filePath
  } : null;
}

function localWpCliCandidates(wordpressRoot, environment = process.env) {
  const siteRoot = siteRootFromWordPress(wordpressRoot);
  const projectCandidates = [
    wordpressRoot && path.join(wordpressRoot, 'wp-cli.phar'),
    siteRoot && path.join(siteRoot, 'wp-cli.phar')
  ];
  const localCandidates = localApplicationRoots(environment).flatMap((root) => [
    path.join(root, 'resources', 'extraResources', 'bin', 'wp-cli', 'wp-cli.phar'),
    path.join(root, 'resources', 'extraResources', 'bin', 'wp-cli', process.platform === 'win32' ? 'win32' : '', 'wp-cli.phar')
  ]);
  return { projectCandidates, localCandidates };
}

function resolveWpCli({ wordpressRoot, php, environment = process.env } = {}) {
  const explicit = wpInvocationFromPath(environment.FACTORY_WP_CLI_PATH, php, 'FACTORY_WP_CLI_PATH');
  if (explicit) {
    return explicit;
  }
  const pathCandidates = process.platform === 'win32'
    ? ['wp.exe', 'wp.cmd', 'wp.bat', 'wp']
    : ['wp'];
  for (const candidate of pathCandidates) {
    const resolved = resolveCommand(candidate);
    if (resolved) {
      return {
        available: true,
        command: resolved.command,
        argsPrefix: resolved.argsPrefix,
        source: 'PATH',
        display: resolved.command
      };
    }
  }
  const candidates = localWpCliCandidates(wordpressRoot, environment);
  for (const candidate of candidates.projectCandidates) {
    const invocation = wpInvocationFromPath(candidate, php, 'project/local configuration');
    if (invocation) {
      return invocation;
    }
  }
  for (const candidate of candidates.localCandidates) {
    const invocation = wpInvocationFromPath(candidate, php, 'LocalWP installation');
    if (invocation) {
      return invocation;
    }
  }
  return {
    available: false,
    command: null,
    argsPrefix: [],
    source: php.available ? 'wp-cli unavailable' : 'PHP and wp-cli unavailable',
    display: null
  };
}

function resolveLocalWpToolchain({ startPath = ROOT_DIR, environment = process.env } = {}) {
  const wordpress = findWordPressRoot(startPath, environment);
  const localSite = resolveLocalSite(wordpress.path, environment);
  const php = resolvePhp({ wordpressRoot: wordpress.path, environment });
  const wpCli = resolveWpCli({ wordpressRoot: wordpress.path, php, environment });
  return {
    wordpressRoot: wordpress.path,
    wordpressRootSource: wordpress.source,
    siteRoot: localSite.siteRoot,
    localSite: localSite.site ? {
      id: localSite.site.id || null,
      name: localSite.site.name || null,
      path: localSite.site.path || null,
      phpVersion: localSite.site.services && localSite.site.services.php
        ? localSite.site.services.php.version
        : localSite.site.phpVersion || null
    } : null,
    localSiteSource: localSite.source,
    php,
    wpCli
  };
}

module.exports = {
  findLocalPhp,
  findWordPressRoot,
  readLocalSiteRegistry,
  resolveLocalSite,
  resolveLocalWpToolchain,
  resolvePhp,
  resolveWpCli,
  siteRootFromWordPress
};
