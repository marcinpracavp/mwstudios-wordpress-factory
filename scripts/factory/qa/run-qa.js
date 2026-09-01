const path = require('path');
const crypto = require('crypto');
const Ajv = require('ajv');

const {
  FACTORY_PATHS,
  getValidationErrors,
  loadFactoryData,
  validateFactoryProject
} = require('../validate-factory');
const { discoverBrowser, formatBrowserDiscoveryFailure, getChromium } = require('./browser');
const { capturePage } = require('./capture');
const { evidenceFingerprints, matrixFingerprint } = require('./evidence');
const { resolveQaPlan } = require('./plan');
const { renderTerminalSummary, writeTrackedReport } = require('./report');
const {
  ROOT_DIR,
  joinUrl,
  parseCliArguments,
  printUsage,
  readJson,
  resetDirectory,
  writeJson
} = require('./utils');

const OUTPUT_DIR = path.join(ROOT_DIR, '.factory-cache', 'qa', 'latest');

function formatSchemaErrors(errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || '/';
    const missing = error.params?.missingProperty ? ` (${error.params.missingProperty})` : '';
    return `QA configuration ${location}: ${error.message}${missing}`;
  });
}

function validateQaConfiguration(qa, qaSchema) {
  const validate = new Ajv({ allErrors: true, strict: true }).compile(qaSchema);
  if (!validate(qa)) {
    return formatSchemaErrors(validate.errors);
  }
  return [];
}

function selectById(items, id, label) {
  if (!id) {
    return items;
  }
  const selected = items.filter((item) => item.id === id);
  if (selected.length === 0) {
    throw new Error(`Unknown ${label} "${id}" in factory/qa.json.`);
  }
  return selected;
}

function selectLanguages(languages, id) {
  const items = Object.entries(languages).map(([languageId, languagePath]) => ({
    id: languageId,
    path: languagePath
  }));
  return selectById(items, id, 'language');
}

function buildTargets({ project, qa, options }) {
  const routes = selectById(qa.routes, options.route, 'route');
  const languages = selectLanguages(qa.languages, options.lang);
  const viewports = selectById(qa.viewports, options.viewport, 'viewport');
  const baseUrl = project.environment?.localUrl;

  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new Error('Factory QA requires environment.localUrl. Configure it in factory/project.json.');
  }

  return {
    baseUrl,
    routes,
    languages,
    viewports,
    targets: languages.flatMap((language) => routes.flatMap((route) => viewports.map((viewport) => ({
      language,
      route,
      viewport,
      url: route.languages && route.languages[language.id]
        ? joinUrl(baseUrl, route.languages[language.id])
        : joinUrl(baseUrl, language.path, route.path)
    }))))
  };
}

function createSummary({ project, baseUrl, browser, selection, generatedAt, checks, planState }) {
  const errors = checks.flatMap((check) => check.errors);
  const warnings = checks.flatMap((check) => check.warnings);
  return {
    runId: `${generatedAt.replace(/[-:.]/g, '')}-${crypto.randomBytes(3).toString('hex')}`,
    planState,
    browser,
    project: {
      name: project.project.name,
      slug: project.project.slug,
      mode: project.mode
    },
    baseUrl,
    routes: selection.routes,
    languages: selection.languages,
    viewports: selection.viewports,
    checks,
    errors,
    warnings,
    generatedAt,
    ...evidenceFingerprints(),
    matrixFingerprint: matrixFingerprint(selection)
  };
}

function interactionsForTarget(interactions, target) {
  return (interactions || []).filter((recipe) => recipe.route === target.route.id
    && (recipe.languages.length === 0 || recipe.languages.includes(target.language.id))
    && (recipe.viewports.length === 0 || recipe.viewports.includes(target.viewport.id)));
}

async function runQa({
  project,
  qa,
  qaSchema,
  options = {},
  browserDiscovery = discoverBrowser(),
  outputDir = OUTPUT_DIR,
  writeReport = true
} = {}) {
  const validationErrors = validateQaConfiguration(qa, qaSchema);
  if (validationErrors.length > 0) {
    throw new Error(`Factory QA configuration is invalid:\n- ${validationErrors.join('\n- ')}`);
  }
  const plan = resolveQaPlan({ project, qa });
  if (plan.errors.length > 0) {
    throw new Error(`Factory QA plan is invalid:\n- ${plan.errors.join('\n- ')}`);
  }
  const resolvedQa = plan.qa;
  const resolvedValidationErrors = validateQaConfiguration(resolvedQa, qaSchema);
  if (resolvedValidationErrors.length > 0) {
    throw new Error(`Resolved Factory QA configuration is invalid:\n- ${resolvedValidationErrors.join('\n- ')}`);
  }
  const selection = buildTargets({ project, qa: resolvedQa, options });

  if (!browserDiscovery.browser) {
    throw new Error(formatBrowserDiscoveryFailure(browserDiscovery.checks));
  }

  const chromium = getChromium();
  resetDirectory(outputDir);
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: browserDiscovery.browser.executablePath,
      headless: true,
      args: ['--disable-gpu', '--disable-background-networking']
    });
  } catch (error) {
    throw new Error(`Factory QA could not launch ${browserDiscovery.browser.name}: ${error.message}`);
  }

  const checks = [];
  try {
    for (const target of selection.targets) {
      const targetOutputDir = path.join(
        outputDir,
        target.language.id,
        target.route.id,
        target.viewport.id
      );
      checks.push(await capturePage({
        browser,
        target,
        outputDir: targetOutputDir,
        sectionFilter: options.section,
        interactions: interactionsForTarget(resolvedQa.interactions, target)
      }));
    }
  } finally {
    await browser.close();
  }

  const summary = createSummary({
    project,
    baseUrl: selection.baseUrl,
    browser: browserDiscovery.browser,
    selection,
    generatedAt: new Date().toISOString(),
    checks,
    planState: plan.state
  });
  writeJson(path.join(outputDir, 'summary.json'), summary);
  if (writeReport) {
    summary.trackedReport = path.relative(ROOT_DIR, writeTrackedReport(ROOT_DIR, summary)).split(path.sep).join('/');
  }
  writeJson(path.join(outputDir, 'summary.json'), summary);

  return summary;
}

async function main() {
  try {
    const options = parseCliArguments(process.argv.slice(2));
    if (options.help) {
      printUsage();
      return;
    }

    const factoryData = loadFactoryData(readJson(FACTORY_PATHS.project));
    const projectErrors = getValidationErrors(validateFactoryProject(factoryData.project));
    if (projectErrors.length > 0) {
      throw new Error(`Factory configuration is invalid:\n- ${projectErrors.join('\n- ')}`);
    }

    const summary = await runQa({
      project: factoryData.project,
      qa: factoryData.qa,
      qaSchema: factoryData.qaSchema,
      options
    });
    renderTerminalSummary(summary);
    process.exitCode = summary.errors.length === 0 ? 0 : 1;
  } catch (error) {
    console.error('Website Factory QA');
    console.error('');
    console.error(`QA FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  OUTPUT_DIR,
  buildTargets,
  createSummary,
  interactionsForTarget,
  runQa,
  selectById,
  selectLanguages,
  validateQaConfiguration
};
