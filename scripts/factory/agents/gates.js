const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  commandAvailable,
  inProcessGate,
  resolveCommand,
  runCommand,
  skippedGate
} = require('./command-runner');
const { resolveProfile } = require('./config');
const { validateConventions } = require('./conventions');
const { ensureRequiredPlugins, findWordPressRoot } = require('./plugin-manager');
const { resolveLocalWpToolchain } = require('../toolchain');
const { resolveQaPlan } = require('../qa/plan');
const { evidenceFingerprints, matrixFingerprint } = require('../qa/evidence');
const { ROOT_DIR, readJson, relativeToRoot } = require('./utils');

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function runNpmGate(id, script) {
  const command = npmCommand();
  if (!commandAvailable(command)) {
    return inProcessGate(id, false, `${command} is not available in PATH.`);
  }
  return runCommand({ id, command, args: ['run', script] });
}

function verifyCodexProfiles(configuration) {
  const command = process.platform === 'win32'
    ? configuration.autopilot.runner.command.windows
    : configuration.autopilot.runner.command.default;
  if (!commandAvailable(command)) {
    return { pass: false, summary: `${command} is not available in PATH.`, command };
  }
  const resolvedCommand = resolveCommand(command);
  const result = spawnSync(
    resolvedCommand.command,
    [...resolvedCommand.argsPrefix, 'debug', 'models'],
    {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
      shell: resolvedCommand.shell === true
    }
  );
  if (result.status !== 0) {
    return { pass: false, summary: result.stderr || 'Could not read the Codex model catalog.', command };
  }
  let catalog;
  try {
    catalog = JSON.parse(result.stdout);
  } catch (error) {
    return { pass: false, summary: `Codex model catalog is not valid JSON: ${error.message}`, command };
  }
  const available = new Map((catalog.models || []).map((model) => [model.slug, model]));
  const errors = [];
  const resolved = Object.keys(configuration.profiles.profiles).map((profileId) => {
    const profile = resolveProfile(configuration, profileId);
    const model = available.get(profile.runtimeModel);
    if (!model) {
      errors.push(`${profile.role} runtime model "${profile.runtimeModel}" is not in the local Codex catalog.`);
    } else if (!(model.supported_reasoning_levels || []).some(
      (level) => level.effort === profile.reasoningEffort
    )) {
      errors.push(`${profile.role} model "${profile.runtimeModel}" does not support effort "${profile.reasoningEffort}".`);
    }
    return `${profile.role}=${profile.runtimeModel}/${profile.reasoningEffort}`;
  });
  return {
    pass: errors.length === 0,
    summary: errors.length === 0 ? resolved.join(', ') : errors.join('\n'),
    command,
    errors,
    resolved
  };
}

function verifyCodexInvocation(configuration) {
  const command = process.platform === 'win32'
    ? configuration.autopilot.runner.command.windows
    : configuration.autopilot.runner.command.default;
  const reviewer = resolveProfile(configuration, 'finalReviewer');
  const result = runCommand({
    id: 'codex-invocation-contract',
    command,
    args: [
      '-a',
      configuration.autopilot.runner.approvalPolicy,
      'exec',
      '--ephemeral',
      '-s',
      reviewer.sandbox,
      '-c',
      `sandbox_workspace_write.network_access=${configuration.autopilot.runner.networkAccess}`,
      '--help'
    ]
  });
  return {
    pass: result.status === 'pass',
    summary: result.status === 'pass'
      ? 'Codex exec accepts the configured approval, ephemeral-session, and sandbox arguments.'
      : result.stderr || result.stdout,
    result
  };
}

function listFiles(directoryPath, predicate) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'vendor', 'dist', '.git', '.factory-cache'].includes(entry.name)) {
      return [];
    }
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return listFiles(entryPath, predicate);
    }
    return predicate(entryPath) ? [entryPath] : [];
  });
}

function preflightGate(configuration) {
  const checks = [];
  const packagePath = path.join(ROOT_DIR, 'package.json');
  const packageJson = fs.existsSync(packagePath) ? readJson(packagePath) : null;
  const requiredScripts = [
    'build',
    'factory:validate',
    'factory:figma:validate',
    'factory:figma:status',
    'factory:qa',
    'factory:autopilot:validate'
  ];
  const wordpressRoot = findWordPressRoot();
  const codexCommand = process.platform === 'win32'
    ? configuration.autopilot.runner.command.windows
    : configuration.autopilot.runner.command.default;

  checks.push({ label: 'Node.js', pass: Boolean(process.version), value: process.version });
  checks.push({
    label: 'npm',
    pass: commandAvailable(npmCommand()),
    value: commandAvailable(npmCommand()) ? npmCommand() : 'not found'
  });
  checks.push({
    label: 'package dependencies',
    pass: fs.existsSync(path.join(ROOT_DIR, 'node_modules')),
    value: fs.existsSync(path.join(ROOT_DIR, 'node_modules')) ? 'node_modules present' : 'run npm ci or npm install'
  });
  checks.push({
    label: 'WordPress root',
    pass: Boolean(wordpressRoot),
    value: wordpressRoot || 'not found'
  });
  checks.push({
    label: 'theme directory',
    pass: fs.existsSync(path.join(ROOT_DIR, 'style.css')) && fs.existsSync(path.join(ROOT_DIR, 'functions.php')),
    value: ROOT_DIR
  });
  checks.push({
    label: 'Local URL',
    pass: typeof configuration.project.environment.localUrl === 'string'
      && configuration.project.environment.localUrl.trim() !== '',
    value: configuration.project.environment.localUrl || 'not configured'
  });
  checks.push({
    label: 'Figma URL',
    pass: typeof configuration.project.figma.url === 'string'
      && configuration.project.figma.url.trim() !== '',
    value: configuration.project.figma.url || 'not configured'
  });
  const responsiveMatrix = responsiveMatrixGate(configuration);
  checks.push({
    label: 'responsive QA matrix',
    pass: responsiveMatrix.status === 'pass',
    value: responsiveMatrix.stdout
  });
  const languageMatrix = languageMatrixGate(configuration);
  checks.push({
    label: 'language QA matrix',
    pass: languageMatrix.status === 'pass',
    value: languageMatrix.stdout
  });
  requiredScripts.forEach((script) => checks.push({
    label: `npm script ${script}`,
    pass: Boolean(packageJson && packageJson.scripts && packageJson.scripts[script]),
    value: packageJson && packageJson.scripts ? packageJson.scripts[script] || 'missing' : 'missing'
  }));
  checks.push({
    label: 'Codex CLI',
    pass: commandAvailable(codexCommand),
    value: commandAvailable(codexCommand) ? codexCommand : 'not found'
  });
  const codexProfiles = verifyCodexProfiles(configuration);
  checks.push({
    label: 'Codex profile mapping',
    pass: codexProfiles.pass,
    value: codexProfiles.summary
  });
  const codexInvocation = verifyCodexInvocation(configuration);
  checks.push({
    label: 'Codex invocation contract',
    pass: codexInvocation.pass,
    value: codexInvocation.summary
  });
  if (commandAvailable(npmCommand())) {
    const dependencyCheck = runCommand({
      id: 'npm-dependencies',
      command: npmCommand(),
      args: ['ls', '--depth=0']
    });
    checks.push({
      label: 'npm dependency tree',
      pass: dependencyCheck.status === 'pass',
      value: dependencyCheck.status === 'pass'
        ? 'npm ls --depth=0 passed'
        : dependencyCheck.stderr || dependencyCheck.stdout
    });
  }

  const readOnlyErrors = checks.filter((check) => !check.pass);
  const pluginResult = readOnlyErrors.length === 0
    ? ensureRequiredPlugins(configuration)
    : {
      gate: skippedGate(
        'plugins',
        'Plugin mutations were not attempted because read-only preflight checks failed.'
      ),
      actions: [],
      errors: []
    };
  checks.push({
    label: 'required plugins',
    pass: pluginResult.gate.status === 'pass' || pluginResult.gate.status === 'skipped',
    value: pluginResult.gate.status === 'skipped'
      ? pluginResult.gate.reason
      : pluginResult.gate.stdout
  });

  const errors = checks.filter((check) => !check.pass);
  return inProcessGate(
    'preflight',
    errors.length === 0,
    checks.map((check) => `${check.pass ? 'PASS' : 'FAIL'} ${check.label}: ${check.value}`).join('\n'),
    {
      checks,
      pluginActions: pluginResult.actions,
      pluginErrors: pluginResult.errors
    }
  );
}

function conventionsGate() {
  const issues = validateConventions();
  return inProcessGate(
    'factory-conventions',
    issues.length === 0,
    issues.length === 0
      ? 'Factory spacing, page-style architecture, and SCSS format conventions passed.'
      : issues.map((issue) => `${issue.code} ${issue.file}:${issue.line} ${issue.message}`).join('\n'),
    { issues }
  );
}

function gitDiffGate() {
  if (!commandAvailable('git')) {
    return skippedGate('git-diff-check', 'git is not available in PATH.');
  }
  return runCommand({ id: 'git-diff-check', command: 'git', args: ['diff', '--check'] });
}

function phpLintGate() {
  const toolchain = resolveLocalWpToolchain();
  if (!toolchain.php.available) {
    return skippedGate('php-lint', 'PHP CLI is unavailable after Factory, PATH, project, and LocalWP resolution.');
  }
  const phpFiles = listFiles(ROOT_DIR, (filePath) => filePath.endsWith('.php'));
  const failures = [];
  phpFiles.forEach((filePath) => {
    const result = runCommand({
      id: 'php-lint-file',
      command: toolchain.php.command,
      args: [...toolchain.php.argsPrefix, '-l', filePath]
    });
    if (result.status !== 'pass') {
      failures.push({ file: relativeToRoot(filePath), error: result.stderr || result.stdout });
    }
  });
  return inProcessGate(
    'php-lint',
    failures.length === 0,
    failures.length === 0
      ? `${phpFiles.length} PHP files passed syntax lint with ${toolchain.php.command}.`
      : failures.map((failure) => `${failure.file}: ${failure.error}`).join('\n'),
    { failures, fileCount: phpFiles.length }
  );
}

function resolvedQaPlan(configuration, requireCompleteSnapshot = false) {
  return resolveQaPlan({
    project: configuration.project,
    qa: configuration.qa,
    requireCompleteSnapshot
  });
}

function responsiveMatrixGate(configuration) {
  const requiredWidths = new Set([1440, 1280, 1024, 768, 390, 375]);
  const manifestPath = path.join(ROOT_DIR, '.factory-cache', 'figma', 'latest', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = readJson(manifestPath);
    (manifest.viewports || []).forEach((viewport) => requiredWidths.add(viewport.width));
  }
  const plan = resolvedQaPlan(configuration);
  const configured = new Set((plan.qa.viewports || []).map((viewport) => viewport.width));
  const missing = [...requiredWidths].filter((width) => !configured.has(width)).sort((a, b) => b - a);
  return inProcessGate(
    'qa-responsive-matrix',
    missing.length === 0,
    missing.length === 0
      ? `Responsive QA widths configured: ${[...configured].sort((a, b) => b - a).join(', ')}`
      : `factory/qa.json is missing required responsive widths: ${missing.join(', ')}`,
    { requiredWidths: [...requiredWidths], configuredWidths: [...configured], missingWidths: missing }
  );
}

function languageMatrixGate(configuration) {
  const required = configuration.project.wordpress.languages || [];
  const configured = Object.keys(configuration.qa.languages || {});
  const missing = required.filter((language) => !configured.includes(language));
  const unexpected = configured.filter((language) => !required.includes(language));
  const pass = missing.length === 0 && unexpected.length === 0;
  return inProcessGate(
    'qa-language-matrix',
    pass,
    pass
      ? `QA languages match project languages: ${required.join(', ')}`
      : `QA languages mismatch (missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}).`,
    { required, configured, missing, unexpected }
  );
}

function routeMatrixGate(configuration) {
  const plan = resolvedQaPlan(configuration);
  if (plan.state !== 'complete') {
    return inProcessGate(
      'qa-route-matrix',
      false,
      `Validated site-map route matrix is ${plan.state}.`,
      { state: plan.state, errors: plan.errors }
    );
  }
  const sitePageIds = plan.siteMap.pages.map((page) => page.id);
  const generated = plan.qa.routes.filter((route) => route.managedBy === 'site-map');
  const generatedIds = generated.map((route) => route.pageId);
  const missing = sitePageIds.filter((id) => !generatedIds.includes(id));
  const unexpected = generatedIds.filter((id) => !sitePageIds.includes(id));
  const pass = plan.errors.length === 0 && missing.length === 0 && unexpected.length === 0;
  return inProcessGate(
    'qa-route-matrix',
    pass,
    pass
      ? `Resolved ${generated.length} site-map route(s): ${generated.map((route) => `${route.id}=${route.path}`).join(', ')}`
      : [...plan.errors, `missing: ${missing.join(', ') || 'none'}`, `unexpected: ${unexpected.join(', ') || 'none'}`].join('\n'),
    { state: plan.state, topology: plan.topology, routes: plan.qa.routes, missing, unexpected }
  );
}

function requiredInteractionCapabilities(siteMap) {
  if (!siteMap) {
    return [];
  }
  const required = (siteMap.capabilities || [])
    .filter((capability) => capability.required)
    .map((capability) => capability.id)
    .filter((id) => ['ecommerce', 'forms', 'sliders', 'search', 'account', 'multilingual'].includes(id));
  const hasNavigation = siteMap.pages.length > 1 || (siteMap.globalComponents || [])
    .some((component) => ['header', 'navigation'].includes(component.type));
  if (hasNavigation) {
    required.push('navigation');
  }
  if ((siteMap.pages || []).length > 0) {
    required.push('semantic-baseline');
  }
  (siteMap.pages || []).forEach((page) => {
    if (['cart', 'checkout', 'account', 'search'].includes(page.routeType)) {
      required.push(page.routeType);
    }
  });
  return [...new Set(required)];
}

function functionalEvidenceGate(configuration) {
  const plan = resolvedQaPlan(configuration);
  const summaryPath = path.join(ROOT_DIR, '.factory-cache', 'qa', 'latest', 'summary.json');
  if (plan.state !== 'complete' || !fs.existsSync(summaryPath)) {
    return inProcessGate('qa-functional-evidence', false, 'Functional evidence requires a complete site-map and current QA summary.');
  }
  const summary = readJson(summaryPath);
  const required = requiredInteractionCapabilities(plan.siteMap);
  const recipes = plan.qa.interactions || [];
  const configuredCapabilities = new Set(recipes.map((recipe) => recipe.capability));
  const missingRecipes = required.filter((capability) => !configuredCapabilities.has(capability));
  const semanticRoutes = plan.siteMap.pages.map((page) => page.id);
  const semanticRecipeRoutes = new Set(recipes
    .filter((recipe) => recipe.capability === 'semantic-baseline')
    .map((recipe) => recipe.route));
  const missingSemanticRoutes = semanticRoutes.filter((routeId) => !semanticRecipeRoutes.has(routeId));
  const evidence = summary.checks.flatMap((check) => check.interactions || []);
  const evidencedIds = new Set(evidence.map((item) => item.id));
  const missingEvidence = recipes.map((recipe) => recipe.id)
    .filter((id) => !evidencedIds.has(id));
  const failed = evidence.filter((item) => item.status !== 'PASS');
  const pass = missingRecipes.length === 0
    && missingSemanticRoutes.length === 0
    && missingEvidence.length === 0
    && failed.length === 0;
  return inProcessGate(
    'qa-functional-evidence',
    pass,
    pass
      ? `${evidence.length} deterministic interaction result(s) cover required project behavior.`
      : `missing capability recipes: ${missingRecipes.join(', ') || 'none'}; missing semantic baseline routes: ${missingSemanticRoutes.join(', ') || 'none'}; missing recipe evidence: ${missingEvidence.join(', ') || 'none'}; failed results: ${failed.map((item) => item.id).join(', ') || 'none'}`,
    { required, missingRecipes, missingSemanticRoutes, missingEvidence, failed }
  );
}

function evidenceFreshnessGate(configuration) {
  const summaryPath = path.join(ROOT_DIR, '.factory-cache', 'qa', 'latest', 'summary.json');
  if (!fs.existsSync(summaryPath)) {
    return inProcessGate('qa-evidence-freshness', false, 'QA summary is missing.');
  }
  const plan = resolvedQaPlan(configuration);
  if (plan.state !== 'complete') {
    return inProcessGate('qa-evidence-freshness', false, `QA route plan is ${plan.state}.`);
  }
  const summary = readJson(summaryPath);
  const current = evidenceFingerprints();
  const languageItems = Object.entries(plan.qa.languages).map(([id, languagePath]) => ({
    id,
    path: languagePath
  }));
  const currentMatrix = matrixFingerprint({
    routes: plan.qa.routes,
    languages: languageItems,
    viewports: plan.qa.viewports
  });
  const expectedKeys = new Set(plan.qa.routes.flatMap((route) => languageItems.flatMap((language) => (
    plan.qa.viewports.map((viewport) => `${language.id}/${route.id}/${viewport.id}`)
  ))));
  const capturedKeys = new Set((summary.checks || []).map((check) => (
    `${check.language}/${check.route}/${check.viewport.id}`
  )));
  const missing = [...expectedKeys].filter((key) => !capturedKeys.has(key));
  const errors = [];
  if (!summary.buildFingerprint || summary.buildFingerprint !== current.buildFingerprint) {
    errors.push('build fingerprint is stale');
  }
  if (summary.sourceFingerprint !== current.sourceFingerprint) {
    errors.push('source fingerprint is stale');
  }
  if (summary.matrixFingerprint !== currentMatrix) {
    errors.push('route/language/viewport matrix fingerprint is stale');
  }
  if (missing.length > 0) {
    errors.push(`missing captures: ${missing.join(', ')}`);
  }
  if ((summary.errors || []).length > 0) {
    errors.push(`QA summary contains ${summary.errors.length} error(s)`);
  }
  return inProcessGate(
    'qa-evidence-freshness',
    errors.length === 0,
    errors.length === 0
      ? `QA run ${summary.runId} is current for build, sources, and ${capturedKeys.size} matrix target(s).`
      : errors.join('\n'),
    { runId: summary.runId || null, generatedAt: summary.generatedAt || null, missing }
  );
}

function runGate(gateId, configuration) {
  const gates = {
    preflight: () => preflightGate(configuration),
    'factory-validate': () => runNpmGate('factory-validate', 'factory:validate'),
    'autopilot-validate': () => runNpmGate('autopilot-validate', 'factory:autopilot:validate'),
    'figma-validate': () => runNpmGate('figma-validate', 'factory:figma:validate'),
    'figma-status': () => runNpmGate('figma-status', 'factory:figma:status'),
    build: () => runNpmGate('build', 'build'),
    'factory-conventions': conventionsGate,
    'git-diff-check': gitDiffGate,
    'php-lint': phpLintGate,
    'required-plugins': () => ensureRequiredPlugins(configuration).gate,
    'factory-qa': () => runNpmGate('factory-qa', 'factory:qa'),
    'qa-responsive-matrix': () => responsiveMatrixGate(configuration),
    'qa-language-matrix': () => languageMatrixGate(configuration),
    'qa-route-matrix': () => routeMatrixGate(configuration),
    'qa-functional-evidence': () => functionalEvidenceGate(configuration),
    'qa-evidence-freshness': () => evidenceFreshnessGate(configuration)
  };
  if (!gates[gateId]) {
    return inProcessGate(gateId, false, `Unknown deterministic gate "${gateId}".`);
  }
  try {
    return gates[gateId]();
  } catch (error) {
    return inProcessGate(gateId, false, error.message);
  }
}

function runGates(gateIds, configuration) {
  return gateIds.map((gateId) => runGate(gateId, configuration));
}

function gatesPassed(results) {
  return results.every((result) => result.status === 'pass' || result.status === 'skipped');
}

module.exports = {
  conventionsGate,
  gatesPassed,
  languageMatrixGate,
  routeMatrixGate,
  functionalEvidenceGate,
  evidenceFreshnessGate,
  requiredInteractionCapabilities,
  phpLintGate,
  preflightGate,
  responsiveMatrixGate,
  runGate,
  runGates,
  verifyCodexInvocation,
  verifyCodexProfiles
};
