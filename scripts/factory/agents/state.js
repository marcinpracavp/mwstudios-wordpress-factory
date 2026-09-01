const fs = require('fs');
const path = require('path');

const {
  ROOT_DIR,
  appendJsonLine,
  createRunId,
  ensureDirectory,
  readJson,
  resolveInside,
  writeJsonAtomic
} = require('./utils');

function getStatePaths(autopilot) {
  const cacheRoot = resolveInside(ROOT_DIR, autopilot.cacheRoot);
  return {
    cacheRoot,
    current: path.join(cacheRoot, 'current.json'),
    runs: path.join(cacheRoot, 'runs')
  };
}

function createStageState(stage) {
  return {
    id: stage.id,
    label: stage.label,
    status: 'pending',
    attempts: 0,
    totalAttempts: 0,
    repairAttempts: 0,
    startedAt: null,
    completedAt: null,
    profile: stage.profile || null,
    resultPath: null,
    gateResults: [],
    issues: [],
    warnings: []
  };
}

function createRunState({ autopilot, project, fingerprint, now = new Date() }) {
  const runId = createRunId(now);
  return {
    schemaVersion: 1,
    runId,
    project: {
      name: project.project.name,
      slug: project.project.slug
    },
    configurationFingerprint: fingerprint,
    status: 'running',
    currentStage: autopilot.pipeline[0].id,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: null,
    manualResumeCount: 0,
    blocker: null,
    stages: Object.fromEntries(autopilot.pipeline.map((stage) => [
      stage.id,
      createStageState(stage)
    ]))
  };
}

function runPaths(paths, runId) {
  const runRoot = path.join(paths.runs, runId);
  return {
    runRoot,
    state: path.join(runRoot, 'state.json'),
    events: path.join(runRoot, 'events.jsonl'),
    results: path.join(runRoot, 'results'),
    reports: path.join(runRoot, 'reports')
  };
}

function saveState(paths, state, event) {
  const currentRunPaths = runPaths(paths, state.runId);
  ensureDirectory(currentRunPaths.results);
  ensureDirectory(currentRunPaths.reports);
  state.updatedAt = new Date().toISOString();
  writeJsonAtomic(currentRunPaths.state, state);
  writeJsonAtomic(paths.current, {
    runId: state.runId,
    state: path.relative(paths.cacheRoot, currentRunPaths.state).split(path.sep).join('/'),
    updatedAt: state.updatedAt
  });
  if (event) {
    appendJsonLine(currentRunPaths.events, {
      at: state.updatedAt,
      runId: state.runId,
      ...event
    });
  }
  return currentRunPaths;
}

function loadCurrentState(paths) {
  if (!fs.existsSync(paths.current)) {
    return null;
  }
  const pointer = readJson(paths.current);
  const statePath = resolveInside(paths.cacheRoot, pointer.state);
  if (!fs.existsSync(statePath)) {
    throw new Error(`Autopilot state pointer references missing file: ${pointer.state}`);
  }
  return readJson(statePath);
}

function createAndSaveRun({ configuration, fingerprint }) {
  const paths = getStatePaths(configuration.autopilot);
  const state = createRunState({
    autopilot: configuration.autopilot,
    project: configuration.project,
    fingerprint
  });
  saveState(paths, state, { type: 'run-created' });
  return { paths, state };
}

function recoverInterruptedState(state) {
  let recovered = false;
  Object.values(state.stages).forEach((stage) => {
    if (stage.status === 'running') {
      stage.status = 'pending';
      stage.attempts = Math.max(0, stage.attempts - 1);
      stage.totalAttempts = Math.max(0, (stage.totalAttempts || 0) - 1);
      stage.warnings.push('Previous process ended while this stage was running; the stage will be retried.');
      recovered = true;
    }
  });
  if (recovered) {
    state.status = 'running';
    state.blocker = null;
  }
  return recovered;
}

function processIsRunning(processId) {
  if (!Number.isInteger(processId) || processId <= 0) {
    return false;
  }
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function acquireRunLock(paths) {
  ensureDirectory(paths.cacheRoot);
  const lockPath = path.join(paths.cacheRoot, 'autopilot.lock');
  if (fs.existsSync(lockPath)) {
    let existing = null;
    try {
      existing = readJson(lockPath);
    } catch (error) {
      existing = null;
    }
    if (existing && processIsRunning(existing.pid)) {
      throw new Error(`Another Autopilot process is active (PID ${existing.pid}).`);
    }
    fs.unlinkSync(lockPath);
  }
  const descriptor = fs.openSync(lockPath, 'wx');
  fs.writeFileSync(descriptor, `${JSON.stringify({
    pid: process.pid,
    startedAt: new Date().toISOString()
  }, null, 2)}\n`, 'utf8');
  fs.closeSync(descriptor);
  return lockPath;
}

function releaseRunLock(lockPath) {
  if (!lockPath || !fs.existsSync(lockPath)) {
    return;
  }
  let lock = null;
  try {
    lock = readJson(lockPath);
  } catch (error) {
    lock = null;
  }
  if (!lock || lock.pid === process.pid) {
    fs.unlinkSync(lockPath);
  }
}

function resetCurrentRun(paths, confirmed) {
  if (!confirmed) {
    throw new Error('Reset requires --confirm-reset. Project data and completed run artifacts are never deleted.');
  }
  if (!fs.existsSync(paths.current)) {
    return { reset: false, message: 'No current Autopilot run exists.' };
  }
  const pointer = readJson(paths.current);
  fs.unlinkSync(paths.current);
  return {
    reset: true,
    message: `Current run pointer cleared (${pointer.runId}). Historical run artifacts were preserved.`
  };
}

function markStageRunning(state, stageId, profile = null) {
  const stage = state.stages[stageId];
  stage.status = 'running';
  stage.attempts += 1;
  stage.totalAttempts = (stage.totalAttempts || 0) + 1;
  stage.startedAt = new Date().toISOString();
  stage.completedAt = null;
  stage.profile = profile || stage.profile;
  stage.gateResults = [];
  stage.issues = [];
  state.currentStage = stageId;
}

function markStageFinished(state, stageId, status, details = {}) {
  const stage = state.stages[stageId];
  stage.status = status;
  stage.completedAt = new Date().toISOString();
  Object.assign(stage, details);
}

module.exports = {
  acquireRunLock,
  createAndSaveRun,
  createRunState,
  getStatePaths,
  loadCurrentState,
  markStageFinished,
  markStageRunning,
  recoverInterruptedState,
  releaseRunLock,
  resetCurrentRun,
  runPaths,
  saveState
};
