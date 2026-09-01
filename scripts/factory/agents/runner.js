const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const Ajv = require('ajv');

const { resolveCommand } = require('./command-runner');
const { PATHS, resolveProfile } = require('./config');
const {
  ROOT_DIR,
  compactText,
  readJson,
  relativeToRoot,
  resolveInside,
  writeJsonAtomic
} = require('./utils');

function buildAgentPrompt({ stage, runId, attempt, promptSource, context = {} }) {
  const compactContext = {
    failedStage: context.failedStage || null,
    gateFailures: context.gateFailures || [],
    previousResultPath: context.previousResultPath || null,
    latestAuditPath: context.latestAuditPath || null,
    note: context.note || null
  };
  return [
    promptSource.trim(),
    '',
    '## Orchestrator runtime context',
    '',
    `Run ID: ${runId}`,
    `Stage: ${stage.id}`,
    `Attempt: ${attempt}`,
    '',
    'Project-specific inputs remain in `factory/project.json`, `factory/figma.json`, `factory/qa.json`, the current snapshot, and current QA artifacts.',
    'Do not start or resume any other Autopilot stage. Do not commit, push, deploy, reset Git, or delete project data.',
    '',
    'Compact previous evidence:',
    '```json',
    JSON.stringify(compactContext, null, 2),
    '```',
    '',
    'Your final response must be only the JSON object required by the configured output schema.'
  ].join('\n');
}

function validateAgentResult(result) {
  const schema = readJson(PATHS.resultSchema);
  const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
  if (!validate(result)) {
    const errors = (validate.errors || []).map((error) => {
      const location = error.instancePath || '/';
      return `${location}: ${error.message}`;
    });
    throw new Error(`Agent result does not match the Factory contract:\n- ${errors.join('\n- ')}`);
  }
  return result;
}

function parseAgentResult(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Codex did not write the required last-message result file.');
  }
  const source = fs.readFileSync(filePath, 'utf8').trim();
  let result;
  try {
    result = JSON.parse(source);
  } catch (error) {
    throw new Error(`Codex last message is not valid JSON: ${error.message}`);
  }
  return validateAgentResult(result);
}

function buildAgentArguments({ configuration, profile, resultPath }) {
  return [
    '-a',
    configuration.autopilot.runner.approvalPolicy,
    'exec',
    '--ephemeral',
    '--color',
    'never',
    '-C',
    ROOT_DIR,
    '-s',
    profile.sandbox,
    '-m',
    profile.runtimeModel,
    '-c',
    `model_reasoning_effort="${profile.reasoningEffort}"`,
    '-c',
    `sandbox_workspace_write.network_access=${configuration.autopilot.runner.networkAccess}`,
    '--output-schema',
    resolveInside(ROOT_DIR, configuration.autopilot.runner.outputSchema),
    '-o',
    resultPath,
    '-'
  ];
}

function runAgent({ configuration, stage, runState, runPaths, context = {} }) {
  const profileId = context.profile || stage.profile;
  const promptPath = context.prompt || stage.prompt;
  const profile = resolveProfile(configuration, profileId);
  const command = process.platform === 'win32'
    ? configuration.autopilot.runner.command.windows
    : configuration.autopilot.runner.command.default;
  const attempt = runState.stages[stage.id].attempts;
  const resultLabel = context.resultLabel || `attempt-${attempt}`;
  const resultPath = path.join(
    runPaths.results,
    `${stage.id}-${resultLabel}-${profileId}.json`
  );

  const resolvedCommand = resolveCommand(command);
  if (!resolvedCommand) {
    return {
      execution: { status: 'failed', exitCode: 1, error: `${command} is not available in PATH.` },
      profile,
      result: null,
      resultPath
    };
  }

  const promptSource = fs.readFileSync(resolveInside(ROOT_DIR, promptPath), 'utf8');
  const prompt = buildAgentPrompt({
    stage,
    runId: runState.runId,
    attempt,
    promptSource,
    context
  });
  const args = buildAgentArguments({ configuration, profile, resultPath });
  const startedAt = new Date();
  const child = spawnSync(
    resolvedCommand.command,
    [...resolvedCommand.argsPrefix, ...args],
    {
      cwd: ROOT_DIR,
      env: process.env,
      input: prompt,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
      shell: resolvedCommand.shell === true
    }
  );
  const finishedAt = new Date();
  const execution = {
    status: child.status === 0 ? 'pass' : 'failed',
    exitCode: typeof child.status === 'number' ? child.status : 1,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    error: child.error ? child.error.message : null,
    stdout: compactText(child.stdout),
    stderr: compactText(child.stderr)
  };

  if (execution.status !== 'pass') {
    return { execution, profile, result: null, resultPath };
  }

  try {
    const result = parseAgentResult(resultPath);
    if (result.stage !== stage.id) {
      throw new Error(`Agent result stage "${result.stage}" does not match requested stage "${stage.id}".`);
    }
    writeJsonAtomic(resultPath, result);
    return {
      execution,
      profile,
      result,
      resultPath,
      relativeResultPath: relativeToRoot(resultPath)
    };
  } catch (error) {
    return {
      execution: { ...execution, status: 'failed', exitCode: 1, error: error.message },
      profile,
      result: null,
      resultPath
    };
  }
}

module.exports = {
  buildAgentArguments,
  buildAgentPrompt,
  parseAgentResult,
  runAgent,
  validateAgentResult
};
