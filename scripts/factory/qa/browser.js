const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function existingPath(candidate) {
  return typeof candidate === 'string' && candidate.trim() !== '' && fs.existsSync(candidate)
    ? candidate
    : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function findOnPath(executables) {
  const command = process.platform === 'win32' ? 'where.exe' : 'which';
  const matches = [];

  executables.forEach((executable) => {
    const result = spawnSync(command, [executable], { encoding: 'utf8', windowsHide: true });
    const paths = result.status === 0
      ? result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
      : [];
    matches.push({ executable, paths });
  });

  return matches;
}

function discoverBrowser() {
  const environmentPath = process.env.FACTORY_BROWSER_PATH || null;
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env.LOCALAPPDATA
    || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
  const chromeCandidates = unique([
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    localAppData && path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
  ]);
  const edgeCandidates = unique([
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    localAppData && path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ]);
  const pathMatches = findOnPath(process.platform === 'win32'
    ? ['chrome.exe', 'msedge.exe', 'chrome', 'msedge']
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']);
  const checks = {
    environment: {
      variable: 'FACTORY_BROWSER_PATH',
      value: environmentPath,
      exists: Boolean(existingPath(environmentPath))
    },
    chrome: chromeCandidates.map((candidate) => ({ path: candidate, exists: Boolean(existingPath(candidate)) })),
    edge: edgeCandidates.map((candidate) => ({ path: candidate, exists: Boolean(existingPath(candidate)) })),
    path: pathMatches
  };

  const environmentBrowser = existingPath(environmentPath);
  if (environmentBrowser) {
    return { browser: { name: 'FACTORY_BROWSER_PATH', executablePath: environmentBrowser }, checks };
  }

  const chrome = chromeCandidates.find(existingPath);
  if (chrome) {
    return { browser: { name: 'Google Chrome', executablePath: chrome }, checks };
  }

  const edge = edgeCandidates.find(existingPath);
  if (edge) {
    return { browser: { name: 'Microsoft Edge', executablePath: edge }, checks };
  }

  for (const match of pathMatches) {
    const executablePath = match.paths.find(existingPath);
    if (executablePath) {
      const name = /edge|msedge/i.test(match.executable) ? 'Microsoft Edge' : 'Google Chrome/Chromium';
      return { browser: { name, executablePath }, checks };
    }
  }

  return { browser: null, checks };
}

function formatBrowserDiscoveryFailure(checks) {
  const lines = [
    'Factory QA could not find a supported system browser.',
    `FACTORY_BROWSER_PATH: ${checks.environment.value || '(not set)'} (${checks.environment.exists ? 'found' : 'not found'})`,
    'Google Chrome paths checked:'
  ];

  checks.chrome.forEach((check) => lines.push(`- ${check.path} (${check.exists ? 'found' : 'not found'})`));
  lines.push('Microsoft Edge paths checked:');
  checks.edge.forEach((check) => lines.push(`- ${check.path} (${check.exists ? 'found' : 'not found'})`));
  lines.push('PATH checks:');
  checks.path.forEach((check) => lines.push(
    `- ${check.executable}: ${check.paths.length > 0 ? check.paths.join(', ') : 'not found'}`
  ));
  lines.push('Set FACTORY_BROWSER_PATH to a Chrome or Edge executable, for example:');
  lines.push('$env:FACTORY_BROWSER_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"');

  return lines.join('\n');
}

function getChromium() {
  try {
    return require('playwright-core').chromium;
  } catch (error) {
    throw new Error(
      'Factory QA requires the devDependency "playwright-core". Run npm install before running factory:qa.'
    );
  }
}

module.exports = {
  discoverBrowser,
  formatBrowserDiscoveryFailure,
  getChromium
};
