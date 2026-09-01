const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const { ROOT_DIR, hashFiles, readJson, resolveInside } = require('./utils');

const PATHS = {
  autopilot: path.join(ROOT_DIR, 'factory', 'agents', 'autopilot.json'),
  profiles: path.join(ROOT_DIR, 'factory', 'agents', 'profiles.json'),
  plugins: path.join(ROOT_DIR, 'factory', 'agents', 'plugins.json'),
  autopilotSchema: path.join(ROOT_DIR, 'factory', 'agents', 'schemas', 'autopilot.schema.json'),
  profilesSchema: path.join(ROOT_DIR, 'factory', 'agents', 'schemas', 'profiles.schema.json'),
  pluginsSchema: path.join(ROOT_DIR, 'factory', 'agents', 'schemas', 'plugins.schema.json'),
  resultSchema: path.join(ROOT_DIR, 'factory', 'agents', 'schemas', 'agent-result.schema.json'),
  project: path.join(ROOT_DIR, 'factory', 'project.json'),
  figma: path.join(ROOT_DIR, 'factory', 'figma.json'),
  qa: path.join(ROOT_DIR, 'factory', 'qa.json')
};

const KNOWN_GATES = new Set([
  'preflight',
  'factory-validate',
  'autopilot-validate',
  'figma-validate',
  'figma-status',
  'build',
  'factory-conventions',
  'git-diff-check',
  'php-lint',
  'required-plugins',
  'factory-qa',
  'qa-responsive-matrix',
  'qa-language-matrix',
  'qa-route-matrix',
  'qa-functional-evidence',
  'qa-evidence-freshness'
]);

const KNOWN_CONDITIONS = new Set(['audit-has-issues', 'audit-fix-ran', 'multilingual-project']);

const REQUIRED_STAGE_SEQUENCE = [
  ['preflight', 'gate'],
  ['figma-discovery', 'agent'],
  ['snapshot-validation', 'gate'],
  ['plugin-provision', 'gate'],
  ['implementation', 'agent'],
  ['evidence-refresh', 'gate'],
  ['final-visual-audit', 'agent'],
  ['audit-fix', 'conditional-agent'],
  ['re-audit', 'conditional-agent'],
  ['final-report', 'report']
];

function schemaErrors(scope, errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || '/';
    const missing = error.params && error.params.missingProperty
      ? ` (${error.params.missingProperty})`
      : '';
    return `${scope} ${location}: ${error.message}${missing}`;
  });
}

function loadAgentConfiguration() {
  return {
    autopilot: readJson(PATHS.autopilot),
    profiles: readJson(PATHS.profiles),
    plugins: readJson(PATHS.plugins),
    project: readJson(PATHS.project),
    figma: readJson(PATHS.figma),
    qa: readJson(PATHS.qa)
  };
}

function validateAgentConfiguration(configuration = loadAgentConfiguration()) {
  const errors = [];
  const ajv = new Ajv({ allErrors: true, strict: true });
  [
    ['autopilot', configuration.autopilot, PATHS.autopilotSchema],
    ['profiles', configuration.profiles, PATHS.profilesSchema],
    ['plugins', configuration.plugins, PATHS.pluginsSchema]
  ].forEach(([scope, value, schemaPath]) => {
    const validate = ajv.compile(readJson(schemaPath));
    if (!validate(value)) {
      errors.push(...schemaErrors(scope, validate.errors));
    }
  });

  const stages = Array.isArray(configuration.autopilot.pipeline)
    ? configuration.autopilot.pipeline
    : [];
  const stageIds = stages.map((stage) => stage.id);
  const duplicates = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
  [...new Set(duplicates)].forEach((id) => errors.push(`duplicate Autopilot stage id "${id}"`));

  stages.forEach((stage) => {
    [stage.profile, stage.repairProfile].filter(Boolean).forEach((profile) => {
      if (!configuration.profiles.profiles[profile]) {
        errors.push(`stage "${stage.id}" references unknown profile "${profile}"`);
      } else if (configuration.profiles.profiles[profile].status === 'reserved') {
        errors.push(`stage "${stage.id}" references reserved profile "${profile}"`);
      }
    });
    [stage.prompt, stage.repairPrompt].filter(Boolean).forEach((promptPath) => {
      const resolved = resolveInside(ROOT_DIR, promptPath);
      if (!fs.existsSync(resolved)) {
        errors.push(`stage "${stage.id}" references missing prompt "${promptPath}"`);
      }
    });
    (stage.gates || []).forEach((gate) => {
      if (!KNOWN_GATES.has(gate)) {
        errors.push(`stage "${stage.id}" references unknown gate "${gate}"`);
      }
    });
    if (stage.retryLimit && !Object.hasOwn(configuration.autopilot.limits, stage.retryLimit)) {
      errors.push(`stage "${stage.id}" references unknown retry limit "${stage.retryLimit}"`);
    }
    if (['agent', 'conditional-agent'].includes(stage.type)
      && (!stage.profile || !stage.prompt)) {
      errors.push(`stage "${stage.id}" must define both profile and prompt`);
    }
    if (['gate', 'report'].includes(stage.type)
      && (!Array.isArray(stage.gates) || stage.gates.length === 0)) {
      errors.push(`stage "${stage.id}" must define at least one deterministic gate`);
    }
    if (stage.type === 'conditional-agent' && !KNOWN_CONDITIONS.has(stage.condition)) {
      errors.push(`stage "${stage.id}" references unknown condition "${stage.condition || ''}"`);
    }
    if (Boolean(stage.repairProfile) !== Boolean(stage.repairPrompt)) {
      errors.push(`stage "${stage.id}" must define repairProfile and repairPrompt together`);
    }
  });

  const stageMap = new Map(stages.map((stage, index) => [stage.id, { stage, index }]));
  let previousRequiredIndex = -1;
  REQUIRED_STAGE_SEQUENCE.forEach(([id, type]) => {
    const entry = stageMap.get(id);
    if (!entry) {
      errors.push(`required Autopilot stage "${id}" is missing`);
      return;
    }
    if (entry.stage.type !== type) {
      errors.push(`required stage "${id}" must have type "${type}"`);
    }
    if (entry.index <= previousRequiredIndex) {
      errors.push(`required stage "${id}" is out of safety-critical pipeline order`);
    }
    previousRequiredIndex = Math.max(previousRequiredIndex, entry.index);
  });

  const roleForStage = (stageId) => {
    const entry = stageMap.get(stageId);
    const profile = entry && configuration.profiles.profiles[entry.stage.profile];
    return profile ? profile.role : null;
  };
  if (roleForStage('implementation') !== 'IMPLEMENTER') {
    errors.push('implementation stage must use an IMPLEMENTER profile');
  }
  if (roleForStage('final-visual-audit') !== 'FINAL_REVIEWER'
    || roleForStage('re-audit') !== 'FINAL_REVIEWER') {
    errors.push('final visual audit and re-audit must use FINAL_REVIEWER profiles');
  }
  if (roleForStage('audit-fix') !== 'AUDIT_FIXER') {
    errors.push('audit-fix stage must use an AUDIT_FIXER profile');
  }
  ['final-visual-audit', 're-audit'].forEach((stageId) => {
    const entry = stageMap.get(stageId);
    const profile = entry && configuration.profiles.profiles[entry.stage.profile];
    if (profile && profile.sandbox !== 'read-only') {
      errors.push(`${stageId} must use a read-only profile`);
    }
  });
  const implementationProfile = stageMap.get('implementation')?.stage.profile;
  const finalReviewProfile = stageMap.get('final-visual-audit')?.stage.profile;
  if (implementationProfile && finalReviewProfile && implementationProfile === finalReviewProfile) {
    errors.push('IMPLEMENTER and FINAL_REVIEWER must use different profiles');
  }

  const pluginCapabilities = configuration.plugins.plugins.map((plugin) => plugin.capability);
  const duplicatePlugins = pluginCapabilities.filter(
    (capability, index) => pluginCapabilities.indexOf(capability) !== index
  );
  [...new Set(duplicatePlugins)].forEach((capability) => {
    errors.push(`duplicate plugin capability "${capability}"`);
  });
  configuration.plugins.plugins.forEach((plugin) => {
    if (plugin.capability === 'acf' && plugin.licenseConfiguredByBoilerplate !== true) {
      errors.push('ACF Pro plugin policy must set licenseConfiguredByBoilerplate=true');
    }
    plugin.packageCandidates.forEach((candidate) => {
      try {
        resolveInside(ROOT_DIR, candidate);
      } catch (error) {
        errors.push(`plugin "${plugin.capability}" has unsafe package candidate "${candidate}"`);
      }
      if (path.extname(candidate).toLowerCase() !== '.zip') {
        errors.push(`plugin "${plugin.capability}" package candidate must be a ZIP file`);
      }
    });
  });

  if (!fs.existsSync(resolveInside(ROOT_DIR, configuration.autopilot.runner.outputSchema))) {
    errors.push('agent output schema is missing');
  }

  return errors;
}

function configurationFiles(configuration = loadAgentConfiguration()) {
  const promptFiles = configuration.autopilot.pipeline
    .flatMap((stage) => [stage.prompt, stage.repairPrompt])
    .filter(Boolean)
    .map((promptPath) => resolveInside(ROOT_DIR, promptPath));
  const agentScripts = fs.readdirSync(path.join(ROOT_DIR, 'scripts', 'factory', 'agents'), {
    withFileTypes: true
  }).filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.join(ROOT_DIR, 'scripts', 'factory', 'agents', entry.name));
  const contractFiles = [
    path.join(ROOT_DIR, 'AGENTS.md'),
    path.join(ROOT_DIR, 'docs', 'factory', 'FACTORY_AUTOPILOT.md'),
    path.join(ROOT_DIR, 'docs', 'factory', 'FIGMA_SNAPSHOT.md'),
    path.join(ROOT_DIR, 'docs', 'factory', 'QA.md'),
    path.join(ROOT_DIR, 'factory', 'schemas', 'project.schema.json'),
    path.join(ROOT_DIR, 'factory', 'schemas', 'qa.schema.json'),
    path.join(ROOT_DIR, 'factory', 'schemas', 'site-map.schema.json'),
    path.join(ROOT_DIR, 'factory', 'schemas', 'figma-snapshot.schema.json'),
    path.join(ROOT_DIR, 'factory', 'schemas', 'figma-section.schema.json'),
    path.join(ROOT_DIR, 'scripts', 'factory', 'toolchain.js'),
    path.join(ROOT_DIR, 'scripts', 'factory', 'qa', 'plan.js'),
    path.join(ROOT_DIR, 'scripts', 'factory', 'qa', 'evidence.js'),
    path.join(ROOT_DIR, 'scripts', 'factory', 'qa', 'capture.js'),
    PATHS.autopilotSchema,
    PATHS.profilesSchema,
    PATHS.pluginsSchema
  ].filter((filePath) => fs.existsSync(filePath));
  return [...new Set([
    PATHS.autopilot,
    PATHS.profiles,
    PATHS.plugins,
    PATHS.project,
    PATHS.figma,
    PATHS.qa,
    PATHS.resultSchema,
    ...promptFiles,
    ...agentScripts,
    ...contractFiles
  ])];
}

function configurationFingerprint(configuration = loadAgentConfiguration()) {
  return hashFiles(configurationFiles(configuration));
}

function resolveProfile(configuration, profileId, environment = process.env) {
  const profile = configuration.profiles.profiles[profileId];
  if (!profile) {
    throw new Error(`Unknown Factory agent profile "${profileId}".`);
  }
  return {
    id: profileId,
    ...profile,
    runtimeModel: environment[profile.runtimeModelEnv] || profile.runtimeModel
  };
}

function factoryValidationCheck() {
  try {
    const errors = validateAgentConfiguration();
    return { label: 'Autopilot configuration', errors };
  } catch (error) {
    return { label: 'Autopilot configuration', errors: [error.message] };
  }
}

module.exports = {
  KNOWN_GATES,
  PATHS,
  configurationFiles,
  configurationFingerprint,
  factoryValidationCheck,
  loadAgentConfiguration,
  resolveProfile,
  schemaErrors,
  validateAgentConfiguration
};
