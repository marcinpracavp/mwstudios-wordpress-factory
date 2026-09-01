const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const Ajv = require('ajv');

const {
  configurationFingerprint,
  loadAgentConfiguration,
  resolveProfile,
  validateAgentConfiguration
} = require('./config');
const {
  lintPageArchitecture,
  lintSpacing,
  validateConventions
} = require('./conventions');
const { parseArguments } = require('./orchestrator');
const { requiredPlugins } = require('./plugin-manager');
const { requiredInteractionCapabilities } = require('./gates');
const { buildAgentArguments, buildAgentPrompt } = require('./runner');
const { resolveCommand } = require('./command-runner');
const { resolveLocalWpToolchain } = require('../toolchain');
const { routeFromSitePage } = require('../qa/plan');
const {
  validatePageStyleOwnership,
  validateSectionReferenceCoverage
} = require('../figma/validate-snapshot');
const {
  createRunState,
  recoverInterruptedState,
  resetCurrentRun
} = require('./state');

test('Autopilot configuration and current Factory conventions are valid', () => {
  const configuration = loadAgentConfiguration();
  assert.deepStrictEqual(validateAgentConfiguration(configuration), []);
  assert.deepStrictEqual(validateConventions(), []);
  assert.match(configurationFingerprint(configuration), /^[a-f0-9]{64}$/);
});

test('logical profiles resolve to verified runtime models and environment overrides', () => {
  const configuration = loadAgentConfiguration();
  assert.strictEqual(
    resolveProfile(configuration, 'discovery').runtimeModel,
    configuration.profiles.profiles.discovery.runtimeModel
  );
  assert.strictEqual(resolveProfile(configuration, 'discovery').logicalModel, 'terra');
  assert.strictEqual(resolveProfile(configuration, 'finalReviewer').logicalModel, 'sol');
  assert.strictEqual(resolveProfile(configuration, 'finalReviewer').sandbox, 'read-only');
  assert.strictEqual(resolveProfile(configuration, 'escalation').status, 'reserved');
  assert.ok(!configuration.autopilot.pipeline.some((stage) => stage.profile === 'escalation'));
  assert.strictEqual(
    resolveProfile(configuration, 'finalReviewer', { FACTORY_CODEX_MODEL_SOL: 'verified-custom-sol' }).runtimeModel,
    'verified-custom-sol'
  );
});

test('CLI parser keeps reset explicit and rejects unknown flags', () => {
  assert.deepStrictEqual(parseArguments(['--dry-run']), {
    dryRun: true,
    status: false,
    resume: false,
    reset: false,
    confirmReset: false,
    help: false
  });
  assert.throws(() => parseArguments(['--confirm-reset']), /only be used with --reset/);
  assert.throws(
    () => parseArguments(['--dry-run', '--reset', '--confirm-reset']),
    /Choose exactly one Autopilot mode/
  );
  assert.throws(() => parseArguments(['--force']), /Unknown Autopilot option/);
});

test('configuration rejects implementer self-certification and writable final review', () => {
  const configuration = loadAgentConfiguration();
  const unsafe = JSON.parse(JSON.stringify(configuration));
  const finalAudit = unsafe.autopilot.pipeline.find((stage) => stage.id === 'final-visual-audit');
  finalAudit.profile = 'implementer';
  const errors = validateAgentConfiguration(unsafe);
  assert.ok(errors.some((error) => /FINAL_REVIEWER/.test(error)));
  assert.ok(errors.some((error) => /different profiles/.test(error)));

  const writable = JSON.parse(JSON.stringify(configuration));
  writable.profiles.profiles.finalReviewer.sandbox = 'workspace-write';
  assert.ok(validateAgentConfiguration(writable).some((error) => /read-only profile/.test(error)));
});

test('interrupted running stage becomes resumable pending state', () => {
  const configuration = loadAgentConfiguration();
  const state = createRunState({
    autopilot: configuration.autopilot,
    project: configuration.project,
    fingerprint: configurationFingerprint(configuration),
    now: new Date('2026-09-01T12:00:00.000Z')
  });
  state.stages.preflight.status = 'running';
  assert.strictEqual(recoverInterruptedState(state), true);
  assert.strictEqual(state.stages.preflight.status, 'pending');
  assert.match(state.stages.preflight.warnings[0], /will be retried/);
});

test('reset requires confirmation and preserves historical run artifacts', () => {
  const cacheRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-reset-'));
  try {
    const paths = {
      cacheRoot,
      current: path.join(cacheRoot, 'current.json'),
      runs: path.join(cacheRoot, 'runs')
    };
    const historicalRun = path.join(paths.runs, 'run-1');
    fs.mkdirSync(historicalRun, { recursive: true });
    fs.writeFileSync(path.join(historicalRun, 'state.json'), '{}\n', 'utf8');
    fs.writeFileSync(paths.current, JSON.stringify({ runId: 'run-1' }), 'utf8');
    assert.throws(() => resetCurrentRun(paths, false), /requires --confirm-reset/);
    assert.strictEqual(resetCurrentRun(paths, true).reset, true);
    assert.strictEqual(fs.existsSync(paths.current), false);
    assert.strictEqual(fs.existsSync(path.join(historicalRun, 'state.json')), true);
  } finally {
    fs.rmSync(cacheRoot, { recursive: true, force: true });
  }
});

test('agent prompt receives compact evidence without a previous transcript', () => {
  const prompt = buildAgentPrompt({
    stage: { id: 'implementation' },
    runId: 'run-1',
    attempt: 1,
    promptSource: 'Generic implementation prompt.',
    context: { gateFailures: [{ id: 'build', exitCode: 1, summary: 'SCSS error' }] }
  });
  assert.match(prompt, /Generic implementation prompt/);
  assert.match(prompt, /SCSS error/);
  assert.doesNotMatch(prompt, /raw transcript/i);
});

test('Codex approval policy is placed before the exec subcommand', () => {
  const configuration = loadAgentConfiguration();
  const profile = resolveProfile(configuration, 'finalReviewer');
  const args = buildAgentArguments({
    configuration,
    profile,
    resultPath: 'result.json'
  });
  assert.deepStrictEqual(args.slice(0, 3), ['-a', 'never', 'exec']);
  assert.strictEqual(args[args.indexOf('-s') + 1], 'read-only');
  assert.ok(args.includes('sandbox_workspace_write.network_access=false'));
  assert.strictEqual(args.filter((argument) => argument === 'exec').length, 1);
});

test('Factory conventions reject exact utility duplication and page-style pathologies', () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-conventions-'));
  try {
    const fixture = path.join(temporaryDirectory, 'fixture.scss');
    fs.writeFileSync(fixture, '.section {\n  padding-top: 90px;\n}\n', 'utf8');
    const spacingIssues = lintSpacing(fixture, [90]);
    assert.strictEqual(spacingIssues[0].code, 'CUSTOM_SPACING_WHERE_UTILITY_EXISTS');
    assert.match(spacingIssues[0].message, /\.pt-90/);
    fs.writeFileSync(fixture, '.section {\n  padding: 90px 0;\n}\n', 'utf8');
    assert.match(lintSpacing(fixture, [90])[0].message, /\.pt-90/);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }

  const pagesRoot = path.join(process.cwd(), 'src', 'css', 'pages');
  const architectureIssues = lintPageArchitecture([
    path.join(pagesRoot, 'homepage.scss'),
    path.join(pagesRoot, 'homepage', '_hero.scss'),
    path.join(pagesRoot, 'style.scss')
  ]);
  assert.ok(architectureIssues.some((issue) => /single top-level file/.test(issue.message)));
  assert.ok(architectureIssues.some((issue) => /giant all-pages/.test(issue.message)));
});

test('pipeline uses split production prompts and refreshes evidence before clean-room review', () => {
  const configuration = loadAgentConfiguration();
  const stages = configuration.autopilot.pipeline;
  assert.strictEqual(configuration.project.topology, 'auto');
  assert.match(stages.find((stage) => stage.id === 'responsive-qa').prompt, /04-responsive-correction/);
  assert.match(stages.find((stage) => stage.id === 'language-qa').prompt, /05-language-correction/);
  assert.match(stages.find((stage) => stage.id === 'functional-qa').prompt, /06-functional-qa-correction/);
  const refreshIndex = stages.findIndex((stage) => stage.id === 'evidence-refresh');
  const reviewIndex = stages.findIndex((stage) => stage.id === 'final-visual-audit');
  assert.ok(refreshIndex > -1 && refreshIndex < reviewIndex);
  assert.ok(stages[refreshIndex].gates.includes('qa-evidence-freshness'));
  assert.strictEqual(configuration.autopilot.policies.importerExecutionRequired, true);
  assert.strictEqual(configuration.autopilot.policies.wordpressRuntimeBootstrapBeforeQa, true);
  assert.strictEqual(configuration.autopilot.policies.sectionReferenceCoverageRequired, true);
  assert.strictEqual(configuration.autopilot.policies.templateFamilyStyleFiles, true);
  assert.strictEqual(configuration.autopilot.policies.semanticFunctionalBaseline, true);
});

test('site-map pages deterministically resolve multipage QA routes and reference widths', () => {
  const viewports = [
    { id: 'desktop', width: 1440, height: 900, source: 'factory-minimum' },
    { id: 'figma-393', width: 393, height: 852, source: 'figma' }
  ];
  const route = routeFromSitePage({
    id: 'about',
    routeIntent: '/about/',
    routeType: 'page',
    languageRoutes: { de: '/uber-uns/' },
    desktopSource: { frames: [{ width: 1440 }] },
    mobileSource: { frames: [{ width: 393 }] }
  }, viewports);
  assert.deepStrictEqual(route.referenceViewports, ['desktop', 'figma-393']);
  assert.strictEqual(route.pageId, 'about');
  assert.strictEqual(route.languages.de, '/uber-uns/');
});

test('site-map schema accepts resolved hybrid pages with per-page mobile source', () => {
  const schema = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), 'factory', 'schemas', 'site-map.schema.json'),
    'utf8'
  ));
  const validate = new Ajv({ strict: true, allErrors: true, allowUnionTypes: true }).compile(schema);
  const frame = {
    nodeId: '1:2',
    language: 'de',
    width: 1440,
    height: 900,
    reference: 'references/full/home-de-desktop.png'
  };
  const value = {
    topology: 'hybrid',
    pages: [{
      id: 'home',
      name: 'Home',
      slugIntent: 'home',
      routeIntent: '/',
      routeType: 'page',
      templateIntent: 'front-page',
      styleFile: 'src/css/pages/homepage.scss',
      styleScope: 'page',
      sections: ['home-intro'],
      sourceFrames: ['1:2'],
      languages: ['de'],
      languageRoutes: { de: '/' },
      desktopSource: { mode: 'figma', frames: [frame] },
      mobileSource: { mode: 'derived', frames: [] },
      requiredCapabilities: [],
      notes: []
    }],
    globalComponents: [],
    languages: ['de'],
    capabilities: [],
    warnings: []
  };
  assert.strictEqual(validate(value), true, JSON.stringify(validate.errors));
});

test('functional capability inventory requires only present interaction domains', () => {
  const required = requiredInteractionCapabilities({
    pages: [{ id: 'home' }, { id: 'contact' }],
    globalComponents: [{ type: 'header' }],
    capabilities: [
      { id: 'forms', required: true },
      { id: 'maps', required: true },
      { id: 'ecommerce', required: false }
    ]
  });
  assert.deepStrictEqual(required.sort(), ['forms', 'navigation', 'semantic-baseline']);
});

test('snapshot coverage requires final mobile and language references without inventing derived ones', () => {
  const errors = [];
  const section = {
    id: 'hero',
    desktopNodeId: '1:1',
    desktopReference: 'references/sections/hero-desktop.png',
    mobileNodeId: null,
    mobileReference: null,
    variants: {}
  };
  validateSectionReferenceCoverage({
    section,
    sectionSnapshot: { source: { languageNodes: {} } },
    sitePage: { mobileSource: { mode: 'figma' } },
    expectedLanguages: ['pl'],
    errors
  });
  assert.ok(errors.some((error) => /mobileSource=figma/.test(error)));

  const languageErrors = [];
  validateSectionReferenceCoverage({
    section: { ...section, variants: {} },
    sectionSnapshot: { source: { languageNodes: { de: { desktopNodeId: '2:1', mobileNodeId: null } } } },
    sitePage: { mobileSource: { mode: 'derived' } },
    expectedLanguages: ['de'],
    errors: languageErrors
  });
  assert.ok(languageErrors.some((error) => /language-specific source/.test(error)));
});

test('template-family styles are shared by template intent while page styles remain page-owned', () => {
  const errors = [];
  validatePageStyleOwnership([
    { id: 'product-a', styleScope: 'template-family', templateIntent: 'single-product', styleFile: 'src/css/pages/product.scss' },
    { id: 'product-b', styleScope: 'template-family', templateIntent: 'single-product', styleFile: 'src/css/pages/product.scss' },
    { id: 'home', styleScope: 'page', templateIntent: 'front-page', styleFile: 'src/css/pages/homepage.scss' },
    { id: 'about', styleScope: 'page', templateIntent: 'page', styleFile: 'src/css/pages/about.scss' }
  ], errors);
  assert.deepStrictEqual(errors, []);

  validatePageStyleOwnership([
    { id: 'product-a', styleScope: 'template-family', templateIntent: 'single-product', styleFile: 'src/css/pages/product-a.scss' },
    { id: 'product-b', styleScope: 'template-family', templateIntent: 'single-product', styleFile: 'src/css/pages/product-b.scss' }
  ], errors);
  assert.ok(errors.some((error) => /template family/.test(error)));
});

test('QA schema supports deterministic semantic and keyboard assertions', () => {
  const schema = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), 'factory', 'schemas', 'qa.schema.json'),
    'utf8'
  ));
  const validate = new Ajv({ strict: true, allErrors: true }).compile(schema);
  const value = {
    $schema: './schemas/qa.schema.json',
    routePlan: {
      source: 'validated-site-map',
      siteMapPath: '.factory-cache/figma/latest/site-map.json',
      preserveManualRoutes: true
    },
    routes: [{
      id: 'home', path: '/', pageId: null, type: 'page', languages: { pl: '/' },
      referenceViewports: [], referenceMode: 'quality', managedBy: 'fallback'
    }],
    languages: { pl: '/' },
    viewports: [{ id: 'desktop', width: 1440, height: 900, source: 'factory-minimum' }],
    interactions: [{
      id: 'home-semantics', capability: 'semantic-baseline', route: 'home', languages: [], viewports: [],
      steps: [
        { action: 'assertCount', selector: 'h1', count: 1 },
        { action: 'assertTagName', selector: '[data-menu-toggle]', tagName: 'button' },
        { action: 'assertAccessibleName', selector: 'input[name=email]', name: 'Email' },
        { action: 'press', selector: '[data-menu-toggle]', key: 'Enter' },
        { action: 'assertAttribute', selector: '[data-menu-toggle]', attribute: 'aria-expanded', value: 'true' },
        { action: 'assertFocused', selector: '[data-menu-toggle]' }
      ]
    }]
  };
  assert.strictEqual(validate(value), true, JSON.stringify(validate.errors));
});

test('plugin requirements are derived only from project capabilities', () => {
  const configuration = loadAgentConfiguration();
  configuration.project.capabilities.enabled = ['acf', 'cf7', 'woocommerce'];
  const slugs = requiredPlugins(configuration).map((plugin) => plugin.slug);
  assert.deepStrictEqual(slugs, [
    'advanced-custom-fields-pro',
    'contact-form-7',
    'woocommerce'
  ]);
});

test('Windows command wrappers resolve without PowerShell execution-policy or cmd-shell dependence', () => {
  if (process.platform !== 'win32') {
    return;
  }
  const codex = resolveCommand('codex.cmd');
  const npm = resolveCommand('npm.cmd');
  assert.ok(codex);
  assert.match(codex.command, /codex\.exe$/i);
  assert.ok(npm);
  assert.match(npm.command, /node\.exe$/i);
  assert.match(npm.argsPrefix[0], /npm-cli\.js$/i);

  const toolchain = resolveLocalWpToolchain();
  assert.ok(toolchain.wordpressRoot);
  assert.ok(toolchain.php.available);
  assert.ok(toolchain.wpCli.available);
  assert.match(toolchain.php.command, /php\.exe$/i);
  assert.ok(toolchain.wpCli.argsPrefix.some((argument) => /wp-cli\.phar$/i.test(argument)));
  assert.ok(toolchain.php.argsPrefix.some((argument) => /php\.ini$/i.test(argument)));
});
