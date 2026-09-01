const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { ROOT_DIR, compactText } = require('./utils');

function findOnPath(command) {
  if (path.isAbsolute(command)) {
    return fs.existsSync(command) ? command : null;
  }
  const pathValue = process.env.Path || process.env.PATH || '';
  const extensions = process.platform === 'win32'
    ? (path.extname(command) ? [''] : (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';'))
    : [''];
  for (const directory of pathValue.split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.join(directory, `${command}${extension.toLowerCase()}`);
      const originalCaseCandidate = path.join(directory, `${command}${extension}`);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      if (fs.existsSync(originalCaseCandidate)) {
        return originalCaseCandidate;
      }
    }
  }
  return null;
}

function findFile(directoryPath, basename, depth = 0) {
  if (!fs.existsSync(directoryPath) || depth > 6) {
    return null;
  }
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === basename.toLowerCase()) {
      return entryPath;
    }
    if (entry.isDirectory()) {
      const found = findFile(entryPath, basename, depth + 1);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function resolveCommand(command) {
  const resolved = findOnPath(command);
  if (!resolved) {
    return null;
  }
  if (process.platform !== 'win32' || !/\.(cmd|bat)$/i.test(resolved)) {
    return { command: resolved, argsPrefix: [] };
  }

  const basename = path.basename(resolved).toLowerCase();
  if (basename === 'npm.cmd') {
    const npmCli = path.join(path.dirname(resolved), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (fs.existsSync(npmCli)) {
      const nodeExecutable = fs.existsSync(path.join(path.dirname(resolved), 'node.exe'))
        ? path.join(path.dirname(resolved), 'node.exe')
        : process.execPath;
      return { command: nodeExecutable, argsPrefix: [npmCli] };
    }
  }
  if (basename === 'codex.cmd') {
    const codexPackage = path.join(
      path.dirname(resolved),
      'node_modules',
      '@openai',
      'codex',
      'node_modules'
    );
    const nativeCodex = findFile(codexPackage, 'codex.exe');
    if (nativeCodex) {
      return { command: nativeCodex, argsPrefix: [] };
    }
  }

  return { command: resolved, argsPrefix: [], shell: true };
}

function commandAvailable(command) {
  return Boolean(resolveCommand(command));
}

function runCommand({ id, command, args = [], cwd = ROOT_DIR, input, environment = process.env }) {
  const startedAt = new Date();
  const resolved = resolveCommand(command);
  if (!resolved) {
    return inProcessMissingCommand(id, command, startedAt);
  }
  const result = spawnSync(resolved.command, [...resolved.argsPrefix, ...args], {
    cwd,
    encoding: 'utf8',
    env: environment,
    input,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
    shell: resolved.shell === true
  });
  const finishedAt = new Date();
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  return {
    id,
    status: exitCode === 0 ? 'pass' : 'failed',
    command: [resolved.command, ...resolved.argsPrefix, ...args],
    exitCode,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    stdout: compactText(result.stdout),
    stderr: compactText(result.stderr || (result.error ? result.error.message : ''))
  };
}

function inProcessMissingCommand(id, command, startedAt) {
  const finishedAt = new Date();
  return {
    id,
    status: 'failed',
    command: [command],
    exitCode: 1,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    stdout: '',
    stderr: `${command} is not available in PATH.`
  };
}

function skippedGate(id, reason) {
  const now = new Date().toISOString();
  return {
    id,
    status: 'skipped',
    command: [],
    exitCode: null,
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    stdout: '',
    stderr: '',
    reason
  };
}

function inProcessGate(id, passed, summary, details = {}) {
  const now = new Date().toISOString();
  return {
    id,
    status: passed ? 'pass' : 'failed',
    command: [],
    exitCode: passed ? 0 : 1,
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    stdout: compactText(summary),
    stderr: '',
    ...details
  };
}

module.exports = {
  commandAvailable,
  inProcessGate,
  resolveCommand,
  runCommand,
  skippedGate
};
