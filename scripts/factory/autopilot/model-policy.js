const STAGES = ['discovery', 'foundation', 'build', 'correct', 'audit', 'final'];

function modelForStage(config, stage) {
  if (!STAGES.includes(stage)) throw new Error(`UNKNOWN_MODEL_STAGE: ${stage}`);
  const expected = ['audit', 'final'].includes(stage) ? 'gpt-5.6-sol' : 'gpt-5.6-terra';
  if (config.stageModels?.[stage] !== expected || config.reasoningEffort !== 'high') {
    throw new Error(`MODEL_POLICY_MISMATCH: ${stage} requires ${expected} high`);
  }
  return expected;
}

function validateModelPolicy(config) {
  return Object.fromEntries(STAGES.map(stage => [stage, { model: modelForStage(config, stage), reasoningEffort: config.reasoningEffort }]));
}

function continuationThread(previous, model, repairResult = false) {
  return previous && (!previous.completed || repairResult) && previous.startedModel === model ? previous.threadId : null;
}

module.exports = { modelForStage, validateModelPolicy, continuationThread };
