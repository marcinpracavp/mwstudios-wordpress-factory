const {
  configurationFingerprint,
  loadAgentConfiguration,
  resolveProfile,
  validateAgentConfiguration
} = require('./config');
const {
  gatesPassed,
  languageMatrixGate,
  responsiveMatrixGate,
  runGates,
  verifyCodexInvocation,
  verifyCodexProfiles
} = require('./gates');
const { inspectPluginPlan } = require('./plugin-manager');
const { resolveQaPlan } = require('../qa/plan');
const { renderDashboard, writeAuditArtifact, writeFinalReport } = require('./reporting');
const { runAgent } = require('./runner');
const {
  createAndSaveRun,
  acquireRunLock,
  getStatePaths,
  loadCurrentState,
  markStageFinished,
  markStageRunning,
  recoverInterruptedState,
  releaseRunLock,
  resetCurrentRun,
  runPaths,
  saveState
} = require('./state');
const { relativeToRoot } = require('./utils');

function parseArguments(argv) {
  const options = {
    dryRun: false,
    status: false,
    resume: false,
    reset: false,
    confirmReset: false,
    help: false
  };
  const flags = {
    '--dry-run': 'dryRun',
    '--status': 'status',
    '--resume': 'resume',
    '--reset': 'reset',
    '--confirm-reset': 'confirmReset',
    '--help': 'help',
    '-h': 'help'
  };
  argv.forEach((argument) => {
    if (!flags[argument]) {
      throw new Error(`Unknown Autopilot option "${argument}".`);
    }
    options[flags[argument]] = true;
  });
  if (options.confirmReset && !options.reset) {
    throw new Error('--confirm-reset may only be used with --reset.');
  }
  const selectedModes = [options.dryRun, options.status, options.resume, options.reset, options.help]
    .filter(Boolean).length;
  if (selectedModes > 1) {
    throw new Error('Choose exactly one Autopilot mode: --dry-run, --status, --resume, --reset, or --help.');
  }
  return options;
}

function printUsage() {
  console.log('Usage: npm run factory:autopilot -- [--dry-run|--status|--resume|--reset --confirm-reset]');
}

function failedGates(results) {
  return results
    .filter((result) => result.status === 'failed')
    .map((result) => ({
      id: result.id,
      exitCode: result.exitCode,
      summary: result.stderr || result.stdout || result.reason || 'Gate failed.'
    }));
}

function blockRun({ paths, state, stageId, reason, details = [] }) {
  markStageFinished(state, stageId, 'blocked', { issues: details });
  state.status = 'blocked';
  state.blocker = {
    stage: stageId,
    reason,
    details,
    at: new Date().toISOString()
  };
  saveState(paths, state, { type: 'run-blocked', stage: stageId, reason });
  return false;
}

function conditionApplies(condition, state, configuration) {
  if (condition === 'audit-has-issues') {
    return state.stages['final-visual-audit'].issues.length > 0;
  }
  if (condition === 'audit-fix-ran') {
    return state.stages['audit-fix'].status !== 'skipped'
      && state.stages['audit-fix'].attempts > 0;
  }
  if (condition === 'multilingual-project') {
    return (configuration.project.wordpress.languages || []).length > 1;
  }
  throw new Error(`Unknown Autopilot condition "${condition}".`);
}

function agentDetails(agentRun) {
  return {
    resultPath: agentRun.relativeResultPath || null,
    issues: agentRun.result ? agentRun.result.issues : [],
    warnings: agentRun.result ? agentRun.result.warnings : [],
    profile: agentRun.profile ? agentRun.profile.id : null
  };
}

function executeAgentStage({ configuration, definition, paths, state, context = {}, allowFindings = false }) {
  const limit = definition.retryLimit
    ? configuration.autopilot.limits[definition.retryLimit]
    : 1;
  if (state.stages[definition.id].attempts >= limit) {
    return blockRun({
      paths,
      state,
      stageId: definition.id,
      reason: `Agent attempt limit (${limit}) was already reached.`
    });
  }

  while (state.stages[definition.id].attempts < limit) {
    markStageRunning(state, definition.id, context.profile || definition.profile);
    saveState(paths, state, { type: 'stage-started', stage: definition.id });
    renderDashboard(configuration, state);
    console.log('');
    console.log(`Starting fresh agent session: ${definition.label}`);

    const activeRunPaths = runPaths(paths, state.runId);
    const agentRun = runAgent({
      configuration,
      stage: definition,
      runState: state,
      runPaths: activeRunPaths,
      context: {
        ...context,
        resultLabel: context.resultLabel || `attempt-${state.stages[definition.id].attempts}`
      }
    });
    const details = agentDetails(agentRun);
    state.stages[definition.id].resultPath = details.resultPath;
    state.stages[definition.id].issues = details.issues;
    state.stages[definition.id].warnings = details.warnings;
    state.stages[definition.id].profile = details.profile;

    if (agentRun.execution.status !== 'pass' || !agentRun.result) {
      const reason = agentRun.execution.error
        || agentRun.execution.stderr
        || agentRun.execution.stdout
        || `Codex exited with code ${agentRun.execution.exitCode}.`;
      if (state.stages[definition.id].attempts >= limit) {
        return blockRun({ paths, state, stageId: definition.id, reason });
      }
      markStageFinished(state, definition.id, 'failed', details);
      saveState(paths, state, { type: 'agent-execution-failed', stage: definition.id, reason });
      continue;
    }

    if (agentRun.result.status === 'blocked') {
      return blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: agentRun.result.summary,
        details: agentRun.result.issues
      });
    }

    const gateResults = runGates(definition.gates || [], configuration);
    state.stages[definition.id].gateResults = gateResults;
    const resultAccepted = allowFindings
      || (agentRun.result.status === 'pass' && agentRun.result.issues.length === 0);
    if (gatesPassed(gateResults) && resultAccepted) {
      markStageFinished(state, definition.id, 'pass', details);
      saveState(paths, state, { type: 'stage-passed', stage: definition.id });
      return true;
    }

    markStageFinished(state, definition.id, 'failed', details);
    if (state.stages[definition.id].attempts >= limit) {
      const gateIssues = failedGates(gateResults);
      return blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: gateIssues.length > 0
          ? `Deterministic gates failed after ${state.stages[definition.id].attempts} attempt(s).`
          : agentRun.result.summary,
        details: gateIssues.length > 0 ? gateIssues : agentRun.result.issues
      });
    }
    state.stages[definition.id].repairAttempts += 1;
    saveState(paths, state, { type: 'agent-retry', stage: definition.id });
  }
  return false;
}

function executeGateStage({ configuration, definition, paths, state }) {
  markStageRunning(state, definition.id, null);
  saveState(paths, state, { type: 'stage-started', stage: definition.id });
  renderDashboard(configuration, state);
  console.log('');
  console.log(`Running deterministic gates: ${definition.gates.join(', ')}`);

  let gateResults = runGates(definition.gates || [], configuration);
  state.stages[definition.id].gateResults = gateResults;
  if (gatesPassed(gateResults)) {
    markStageFinished(state, definition.id, 'pass', { gateResults });
    saveState(paths, state, { type: 'stage-passed', stage: definition.id });
    return true;
  }

  const repairLimit = definition.retryLimit
    ? configuration.autopilot.limits[definition.retryLimit]
    : 0;
  while (definition.repairProfile
    && state.stages[definition.id].repairAttempts < repairLimit) {
    state.stages[definition.id].repairAttempts += 1;
    saveState(paths, state, {
      type: 'repair-started',
      stage: definition.id,
      repairAttempt: state.stages[definition.id].repairAttempts
    });
    const activeRunPaths = runPaths(paths, state.runId);
    const agentRun = runAgent({
      configuration,
      stage: definition,
      runState: state,
      runPaths: activeRunPaths,
      context: {
        profile: definition.repairProfile,
        prompt: definition.repairPrompt,
        failedStage: definition.id,
        gateFailures: failedGates(gateResults),
        resultLabel: `repair-${state.stages[definition.id].repairAttempts}`
      }
    });
    if (agentRun.execution.status !== 'pass' || !agentRun.result) {
      continue;
    }
    state.stages[definition.id].resultPath = agentRun.relativeResultPath;
    state.stages[definition.id].issues = agentRun.result.issues;
    state.stages[definition.id].warnings = agentRun.result.warnings;
    state.stages[definition.id].profile = agentRun.profile.id;
    if (agentRun.result.status === 'blocked') {
      return blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: agentRun.result.summary,
        details: agentRun.result.issues
      });
    }
    gateResults = runGates(definition.gates || [], configuration);
    state.stages[definition.id].gateResults = gateResults;
    if (gatesPassed(gateResults)) {
      markStageFinished(state, definition.id, 'pass', { gateResults });
      saveState(paths, state, { type: 'stage-passed-after-repair', stage: definition.id });
      return true;
    }
  }

  return blockRun({
    paths,
    state,
    stageId: definition.id,
    reason: `Deterministic gates failed and the configured repair limit was reached.`,
    details: failedGates(gateResults)
  });
}

function executeAuditAgent({ configuration, definition, paths, state, latestAuditPath }) {
  markStageRunning(state, definition.id, definition.profile);
  saveState(paths, state, { type: 'stage-started', stage: definition.id });
  const freshnessResults = runGates(['qa-evidence-freshness'], configuration);
  state.stages[definition.id].gateResults = freshnessResults;
  if (!gatesPassed(freshnessResults)) {
    return {
      completed: blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: 'Final reviewer was not started because browser evidence is stale or incomplete.',
        details: failedGates(freshnessResults)
      }),
      accepted: false,
      auditPath: null
    };
  }
  renderDashboard(configuration, state);
  console.log('');
  console.log(`Starting clean-room review: ${definition.label}`);
  const agentRun = runAgent({
    configuration,
    stage: definition,
    runState: state,
    runPaths: runPaths(paths, state.runId),
    context: {
      latestAuditPath,
      resultLabel: `review-${state.stages[definition.id].attempts}`
    }
  });
  if (agentRun.execution.status !== 'pass' || !agentRun.result) {
    return {
      completed: blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: agentRun.execution.error
          || agentRun.execution.stderr
          || agentRun.execution.stdout
          || 'Final reviewer did not return a valid structured result.'
      }),
      accepted: false,
      auditPath: null
    };
  }
  if (agentRun.result.status === 'blocked') {
    return {
      completed: blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: agentRun.result.summary,
        details: agentRun.result.issues
      }),
      accepted: false,
      auditPath: null
    };
  }
  const auditPath = writeAuditArtifact(agentRun.result, state, definition.label);
  const accepted = agentRun.result.status === 'pass' && agentRun.result.issues.length === 0;
  markStageFinished(state, definition.id, accepted ? 'pass' : 'failed', {
    resultPath: agentRun.relativeResultPath,
    issues: agentRun.result.issues,
    warnings: agentRun.result.warnings,
    profile: agentRun.profile.id,
    auditPath: relativeToRoot(auditPath)
  });
  saveState(paths, state, {
    type: accepted ? 'audit-passed' : 'audit-findings',
    stage: definition.id,
    issueCount: agentRun.result.issues.length
  });
  return { completed: true, accepted, auditPath: relativeToRoot(auditPath) };
}

function executeFinalAuditLoop({ configuration, paths, state }) {
  const definitions = Object.fromEntries(
    configuration.autopilot.pipeline.map((stage) => [stage.id, stage])
  );
  const initialState = state.stages['final-visual-audit'];
  let review;
  if (initialState.status === 'pass') {
    review = { completed: true, accepted: true, auditPath: initialState.auditPath || null };
  } else if (initialState.status === 'failed' && initialState.issues.length > 0) {
    review = { completed: true, accepted: false, auditPath: initialState.auditPath || null };
  } else {
    review = executeAuditAgent({
      configuration,
      definition: definitions['final-visual-audit'],
      paths,
      state,
      latestAuditPath: null
    });
    if (!review.completed) {
      return false;
    }
  }
  if (review.accepted) {
    markStageFinished(state, 'audit-fix', 'skipped');
    markStageFinished(state, 're-audit', 'skipped');
    saveState(paths, state, { type: 'audit-fix-skipped' });
    return true;
  }

  const fixDefinition = definitions['audit-fix'];
  const reviewDefinition = definitions['re-audit'];
  const maxFixes = configuration.autopilot.limits.auditFixLoops;
  const maxReviews = configuration.autopilot.limits.finalReviewAttempts;
  let fixes = state.stages['audit-fix'].attempts;
  let reviews = state.stages['final-visual-audit'].attempts + state.stages['re-audit'].attempts;

  if (state.stages['re-audit'].status === 'pass') {
    return true;
  }
  if (state.stages['re-audit'].status === 'failed' && state.stages['re-audit'].issues.length > 0) {
    review.auditPath = state.stages['re-audit'].auditPath || review.auditPath;
  }

  const fixCompletedAt = state.stages['audit-fix'].completedAt;
  const reAuditCompletedAt = state.stages['re-audit'].completedAt;
  const unreviewedFix = state.stages['audit-fix'].status === 'pass'
    && fixCompletedAt
    && (!reAuditCompletedAt || fixCompletedAt > reAuditCompletedAt);
  if (unreviewedFix && reviews < maxReviews) {
    reviews += 1;
    review = executeAuditAgent({
      configuration,
      definition: reviewDefinition,
      paths,
      state,
      latestAuditPath: review.auditPath
    });
    if (!review.completed) {
      return false;
    }
    if (review.accepted) {
      return true;
    }
  }

  while (fixes < maxFixes && reviews < maxReviews) {
    fixes += 1;
    const fixed = executeAgentStage({
      configuration,
      definition: fixDefinition,
      paths,
      state,
      context: {
        latestAuditPath: review.auditPath,
        resultLabel: `fix-${fixes}`
      },
      allowFindings: true
    });
    if (!fixed) {
      return false;
    }
    reviews += 1;
    review = executeAuditAgent({
      configuration,
      definition: reviewDefinition,
      paths,
      state,
      latestAuditPath: review.auditPath
    });
    if (!review.completed) {
      return false;
    }
    if (review.accepted) {
      return true;
    }
  }

  return blockRun({
    paths,
    state,
    stageId: 're-audit',
    reason: 'Independent final audit still has findings after configured audit fix/review limits.',
    details: state.stages['re-audit'].issues
  });
}

function executeReportStage({ configuration, definition, paths, state }) {
  markStageRunning(state, definition.id, null);
  saveState(paths, state, { type: 'stage-started', stage: definition.id });
  const gateResults = runGates(definition.gates || [], configuration);
  state.stages[definition.id].gateResults = gateResults;
  if (!gatesPassed(gateResults)) {
    return blockRun({
      paths,
      state,
      stageId: definition.id,
      reason: 'Final deterministic gates failed.',
      details: failedGates(gateResults)
    });
  }
  markStageFinished(state, definition.id, 'pass', { gateResults });
  state.status = 'pass';
  state.completedAt = new Date().toISOString();
  const reportPaths = writeFinalReport(configuration, state, runPaths(paths, state.runId));
  state.stages[definition.id].resultPath = relativeToRoot(reportPaths.jsonPath);
  saveState(paths, state, { type: 'run-completed' });
  return true;
}

function stageSatisfied(definition, state) {
  const status = state.stages[definition.id].status;
  if (status === 'pass' || status === 'skipped') {
    return true;
  }
  if (definition.id === 'final-visual-audit'
    && (state.stages['re-audit'].status === 'pass'
      || state.stages['final-visual-audit'].status === 'pass')) {
    return true;
  }
  if (definition.id === 'audit-fix' && state.stages['re-audit'].status === 'pass') {
    return true;
  }
  return false;
}

function printDryRun(configuration, state, fingerprint) {
  const plan = inspectPluginPlan(configuration);
  const qaPlan = resolveQaPlan({ project: configuration.project, qa: configuration.qa });
  const responsive = responsiveMatrixGate(configuration);
  const languages = languageMatrixGate(configuration);
  const codexProfiles = verifyCodexProfiles(configuration);
  const codexInvocation = verifyCodexInvocation(configuration);
  renderDashboard(configuration, state);
  console.log('');
  console.log('DRY RUN');
  console.log(`Configuration fingerprint: ${fingerprint}`);
  console.log(`Resume state: ${state ? `${state.status} / ${state.currentStage}` : 'none'}`);
  console.log(`Project topology: ${(configuration.project.topology || 'auto').toUpperCase()}`);
  console.log(`Resolved topology: ${qaPlan.state === 'complete' ? qaPlan.topology.toUpperCase() : 'NOT RESOLVED'}`);
  console.log(`Site map: ${qaPlan.state.toUpperCase()}`);
  console.log(`WordPress root: ${plan.wordpressRoot || 'NOT FOUND'}`);
  console.log(`PHP: ${plan.toolchain.php.available ? `${[plan.toolchain.php.command, ...plan.toolchain.php.argsPrefix].join(' ')} (${plan.toolchain.php.source})` : 'UNAVAILABLE'}`);
  console.log(`WP-CLI: ${plan.wpCommand ? `${plan.wpCommand} (${plan.toolchain.wpCli.source})` : 'UNAVAILABLE'}`);
  console.log(`Codex model catalog: ${codexProfiles.pass ? 'PASS' : `FAIL ${codexProfiles.summary}`}`);
  console.log(`Codex invocation contract: ${codexInvocation.pass ? 'PASS' : `FAIL ${codexInvocation.summary}`}`);
  console.log(`Responsive matrix: ${responsive.status.toUpperCase()} ${responsive.stdout}`);
  console.log(`Language matrix: ${languages.status.toUpperCase()} ${languages.stdout}`);
  console.log(`Route matrix: ${qaPlan.state.toUpperCase()} ${qaPlan.qa.routes.map((route) => `${route.id}=${route.path}`).join(', ')}`);
  console.log(`Final evidence freshness gate: ${configuration.autopilot.pipeline.some((stage) => (stage.gates || []).includes('qa-evidence-freshness')) ? 'CONFIGURED' : 'MISSING'}`);
  console.log('');
  console.log('Resolved agent routing:');
  Object.entries(configuration.profiles.profiles).forEach(([id]) => {
    const profile = resolveProfile(configuration, id);
    console.log(`- ${profile.role}: ${profile.status.toUpperCase()} | ${profile.logicalModel} -> ${profile.runtimeModel} / ${profile.reasoningEffort}${profile.reservedFor ? ` | ${profile.reservedFor}` : ''}`);
  });
  console.log('');
  console.log('Required plugin plan:');
  plan.requirements.forEach((plugin) => {
    const license = plugin.capability === 'acf'
      ? `, licenseConfiguredByBoilerplate=${plugin.licenseConfiguredByBoilerplate}`
      : '';
    console.log(`- ${plugin.name}: installed=${plugin.installed ?? 'unknown'}, active=${plugin.active ?? 'unknown'}, source=${plugin.source}${license}`);
  });
  if (plan.requirements.length === 0) {
    console.log('- none');
  }
  if (plan.unsupportedCapabilities.length > 0) {
    console.log(`- unsupported discovered plugin capabilities: ${plan.unsupportedCapabilities.join(', ')}`);
  }
  console.log('');
  console.log('Resolved stages and gates:');
  configuration.autopilot.pipeline.forEach((stage) => {
    const profile = stage.profile ? resolveProfile(configuration, stage.profile) : null;
    const parts = [stage.type];
    if (profile) {
      parts.push(`${profile.role}/${profile.runtimeModel}/${profile.reasoningEffort}`);
    }
    if (stage.gates && stage.gates.length > 0) {
      parts.push(`gates=${stage.gates.join(',')}`);
    }
    if (stage.prompt) {
      parts.push(`prompt=${stage.prompt}`);
    }
    if (stage.repairPrompt) {
      parts.push(`repairPrompt=${stage.repairPrompt}`);
    }
    console.log(`- ${stage.id}: ${parts.join(' | ')}`);
  });
  console.log('');
  console.log('No agent session, Figma discovery, implementation, plugin mutation, QA browser run, or state write was executed.');
  console.log('FACTORY AUTOPILOT DRY RUN COMPLETE');
}

function prepareRun(configuration, options, fingerprint) {
  const paths = getStatePaths(configuration.autopilot);
  let state = loadCurrentState(paths);
  if (!state) {
    return createAndSaveRun({ configuration, fingerprint });
  }
  if (state.configurationFingerprint !== fingerprint) {
    throw new Error(
      'Autopilot configuration changed since the current run began. Use the explicit reset command to start a new run; project and historical run data will be preserved.'
    );
  }
  if (state.status === 'pass') {
    return { paths, state, complete: true };
  }
  if (state.status === 'blocked' && !options.resume) {
    return { paths, state, blocked: true };
  }
  if (state.status === 'blocked' && options.resume) {
    const blockedStage = state.stages[state.currentStage];
    if (blockedStage) {
      blockedStage.status = 'pending';
      blockedStage.attempts = 0;
      blockedStage.repairAttempts = 0;
      blockedStage.warnings.push('Operator explicitly resumed this blocked stage; its repair allowance was restarted.');
    }
    if (['audit-fix', 're-audit'].includes(state.currentStage)) {
      ['audit-fix', 're-audit'].forEach((stageId) => {
        state.stages[stageId].status = 'pending';
        state.stages[stageId].attempts = 0;
        state.stages[stageId].repairAttempts = 0;
      });
    }
    state.manualResumeCount += 1;
    state.status = 'running';
    state.blocker = null;
  }
  const recovered = recoverInterruptedState(state);
  saveState(paths, state, {
    type: options.resume ? 'manual-resume' : recovered ? 'interrupted-run-recovered' : 'auto-resume'
  });
  return { paths, state };
}

function runPipeline(configuration, options, fingerprint) {
  const prepared = prepareRun(configuration, options, fingerprint);
  const { paths, state } = prepared;
  if (prepared.complete) {
    renderDashboard(configuration, state);
    console.log('');
    console.log('Autopilot pipeline already completed.');
    return true;
  }
  if (prepared.blocked) {
    renderDashboard(configuration, state);
    console.log('');
    console.log(`BLOCKED: ${state.blocker.reason}`);
    console.log('Use npm run factory:autopilot:resume after resolving the external blocker, or perform an explicit reset for a new run.');
    return false;
  }

  for (const definition of configuration.autopilot.pipeline) {
    if (stageSatisfied(definition, state)) {
      continue;
    }
    if (definition.type === 'conditional-agent' && !conditionApplies(definition.condition, state, configuration)) {
      markStageFinished(state, definition.id, 'skipped');
      saveState(paths, state, { type: 'stage-skipped', stage: definition.id });
      continue;
    }
    if (definition.id === 'final-visual-audit') {
      if (!executeFinalAuditLoop({ configuration, paths, state })) {
        return false;
      }
      continue;
    }

    let passed;
    if (definition.type === 'gate') {
      passed = executeGateStage({ configuration, definition, paths, state });
    } else if (definition.type === 'agent' || definition.type === 'conditional-agent') {
      passed = executeAgentStage({ configuration, definition, paths, state });
    } else if (definition.type === 'report') {
      passed = executeReportStage({ configuration, definition, paths, state });
    } else {
      passed = blockRun({
        paths,
        state,
        stageId: definition.id,
        reason: `Unsupported stage type "${definition.type}".`
      });
    }
    if (!passed) {
      return false;
    }
  }
  renderDashboard(configuration, state);
  return state.status === 'pass';
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      printUsage();
      return;
    }
    const configuration = loadAgentConfiguration();
    const errors = validateAgentConfiguration(configuration);
    if (errors.length > 0) {
      throw new Error(`Autopilot configuration is invalid:\n- ${errors.join('\n- ')}`);
    }
    const fingerprint = configurationFingerprint(configuration);
    const paths = getStatePaths(configuration.autopilot);

    if (options.reset) {
      if (!options.confirmReset) {
        throw new Error('Reset requires --confirm-reset. Project data and completed run artifacts are never deleted.');
      }
      const lockPath = acquireRunLock(paths);
      try {
        const result = resetCurrentRun(paths, options.confirmReset);
        console.log(result.message);
      } finally {
        releaseRunLock(lockPath);
      }
      return;
    }
    const currentState = loadCurrentState(paths);
    if (options.status) {
      renderDashboard(configuration, currentState);
      if (currentState && currentState.blocker) {
        console.log('');
        console.log(`BLOCKER: ${currentState.blocker.reason}`);
      }
      return;
    }
    if (options.dryRun) {
      printDryRun(configuration, currentState, fingerprint);
      return;
    }

    const lockPath = acquireRunLock(paths);
    try {
      const passed = runPipeline(configuration, options, fingerprint);
      process.exitCode = passed ? 0 : 1;
    } finally {
      releaseRunLock(lockPath);
    }
  } catch (error) {
    console.error('MWSTUDIOS WEBSITE FACTORY');
    console.error('FACTORY AUTOPILOT');
    console.error('');
    console.error(`FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  executeAgentStage,
  executeGateStage,
  executeFinalAuditLoop,
  failedGates,
  parseArguments,
  prepareRun,
  printDryRun,
  runPipeline
};
