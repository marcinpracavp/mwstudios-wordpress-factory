const fs = require('fs');
const path = require('path');
const readline = require('readline');

const {
  FACTORY_PATHS,
  getValidationErrors,
  isFigmaUrl,
  isHttpUrl,
  validateFactoryProject
} = require('./validate-factory');
const {
  DEFAULT_CONTEXT_PATH,
  generateProjectContext,
  writeProjectContext
} = require('./generate-context');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const FACTORY_VERSION = '0.1.0';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;
const MANAGED_CAPABILITIES = new Set([
  'acf',
  'cf7',
  'polylang',
  'woocommerce',
  'google-maps',
  'swiper',
  'aos',
  'lenis',
  'blog',
  'topbar',
  'promo-popup'
]);
const DEFAULT_BUILD = {
  distStrategy: 'local-release-artifact',
  release: {
    includeDist: true,
    includeSource: true,
    includeVendor: true,
    excludeNodeModules: true,
    excludeGit: true
  }
};

class InputClosedError extends Error {
  constructor(message = 'Input ended before initialization was complete. No files were changed.') {
    super(message);
    this.name = 'InputClosedError';
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createNeutralManifest() {
  return {
    $schema: './schemas/project.schema.json',
    factoryVersion: FACTORY_VERSION,
    mode: 'boilerplate',
    topology: 'auto',
    project: {
      name: 'MWStudios Website Factory',
      slug: 'mwstudios-factory',
      themeName: 'MWStudios Website Factory',
      textDomain: 'mwstudios-factory',
      prefix: 'mwf'
    },
    environment: {
      localUrl: null,
      productionUrl: null
    },
    wordpress: {
      acfPro: true,
      languages: ['pl'],
      defaultLanguage: 'pl'
    },
    capabilities: {
      enabled: ['acf', 'swiper']
    },
    figma: {
      url: null,
      page: null,
      rootNode: null
    },
    build: clone(DEFAULT_BUILD)
  };
}

function slugify(value) {
  const transliterated = String(value)
    .trim()
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'project';
}

function slugToPrefix(slug) {
  const prefix = slug.replace(/-/g, '_');
  return /^[a-z]/.test(prefix) ? prefix : `project_${prefix}`;
}

function parseLanguages(value) {
  return [...new Set(
    String(value)
      .toLowerCase()
      .split(/[\s,;]+/)
      .map((language) => language.trim())
      .filter(Boolean)
  )];
}

function parseBoolean(value) {
  const normalized = String(value).trim().toLowerCase();

  if (['y', 'yes', 't', 'tak', 'true', '1'].includes(normalized)) {
    return true;
  }
  if (['n', 'no', 'nie', 'false', '0'].includes(normalized)) {
    return false;
  }

  return null;
}

function formatPrompt(specification) {
  if (specification.type === 'boolean') {
    return `${specification.label} [${specification.defaultValue ? 'Y/n' : 'y/N'}]: `;
  }

  const hasDefault = specification.defaultValue !== undefined
    && specification.defaultValue !== null
    && specification.defaultValue !== '';
  const suffix = hasDefault ? ` [${specification.defaultValue}]` : '';

  return `${specification.label}${suffix}: `;
}

function createLinePrompt({ input = process.stdin, output = process.stdout } = {}) {
  const interfaceInstance = readline.createInterface({
    input,
    output,
    crlfDelay: Infinity,
    terminal: Boolean(input.isTTY && output.isTTY)
  });
  const iterator = interfaceInstance[Symbol.asyncIterator]();
  let interrupted = false;

  interfaceInstance.on('SIGINT', () => {
    interrupted = true;
    interfaceInstance.close();
  });

  return {
    async prompt(specification) {
      output.write(formatPrompt(specification));
      const result = await iterator.next();

      if (result.done) {
        throw new InputClosedError(
          interrupted
            ? 'Initialization cancelled. No files were changed.'
            : undefined
        );
      }

      return result.value;
    },
    close() {
      interfaceInstance.close();
    }
  };
}

async function askValue(prompt, logger, specification) {
  while (true) {
    const rawValue = await prompt(specification);
    const trimmedValue = String(rawValue).trim();
    let value;

    if (trimmedValue === '' && specification.defaultValue !== undefined) {
      value = specification.defaultValue;
    } else if (trimmedValue === '' && specification.optional) {
      value = null;
    } else {
      value = trimmedValue;
    }

    if (specification.transform && value !== null) {
      value = specification.transform(value);
    }

    const validationError = specification.validate
      ? specification.validate(value)
      : null;

    if (!validationError) {
      return value;
    }

    logger.error(`Invalid ${specification.errorLabel || specification.label}: ${validationError}`);
  }
}

async function askBoolean(prompt, logger, key, label, defaultValue) {
  return askValue(prompt, logger, {
    key,
    label,
    type: 'boolean',
    defaultValue,
    transform: parseBoolean,
    validate: (value) => typeof value === 'boolean'
      ? null
      : 'enter yes or no.'
  });
}

async function chooseExistingAction(prompt, logger) {
  return askValue(prompt, logger, {
    key: 'existingAction',
    label: 'Action (edit existing/recreate/cancel)',
    defaultValue: 'cancel',
    transform: (value) => {
      const normalized = value.toLowerCase();
      const actions = {
        '1': 'edit',
        e: 'edit',
        edit: 'edit',
        'edit existing': 'edit',
        '2': 'recreate',
        r: 'recreate',
        recreate: 'recreate',
        '3': 'cancel',
        c: 'cancel',
        cancel: 'cancel'
      };

      return actions[normalized] || normalized;
    },
    validate: (value) => ['edit', 'recreate', 'cancel'].includes(value)
      ? null
      : 'choose edit, recreate, or cancel.'
  });
}

function capabilityIsEnabled(project, id) {
  return Array.isArray(project.capabilities?.enabled)
    && project.capabilities.enabled.includes(id);
}

function currentDefault(project, action, getter, fallback) {
  if (action !== 'edit') {
    return fallback;
  }

  const value = getter(project);
  return value === undefined || value === null ? fallback : value;
}

async function collectProjectConfiguration({ prompt, logger, existingProject, action }) {
  const editing = action === 'edit';
  const nameDefault = editing ? existingProject.project?.name : undefined;
  const projectName = await askValue(prompt, logger, {
    key: 'projectName',
    label: 'Project name',
    defaultValue: nameDefault,
    validate: (value) => typeof value === 'string' && value.trim() !== ''
      ? null
      : 'enter a project name.'
  });

  const suggestedSlug = editing && projectName === existingProject.project?.name
    ? existingProject.project?.slug || slugify(projectName)
    : slugify(projectName);
  const projectSlug = await askValue(prompt, logger, {
    key: 'projectSlug',
    label: 'Project slug',
    defaultValue: suggestedSlug,
    validate: (value) => SLUG_PATTERN.test(value)
      ? null
      : 'use lowercase kebab-case (letters, digits, and single hyphens).'
  });

  const suggestedThemeName = editing && projectName === existingProject.project?.name
    ? existingProject.project?.themeName || projectName
    : projectName;
  const themeName = await askValue(prompt, logger, {
    key: 'themeName',
    label: 'Theme name',
    defaultValue: suggestedThemeName,
    validate: (value) => typeof value === 'string' && value.trim() !== ''
      ? null
      : 'enter a theme name.'
  });

  const suggestedTextDomain = editing && projectSlug === existingProject.project?.slug
    ? existingProject.project?.textDomain || projectSlug
    : projectSlug;
  const textDomain = await askValue(prompt, logger, {
    key: 'textDomain',
    label: 'Text domain',
    defaultValue: suggestedTextDomain,
    validate: (value) => SLUG_PATTERN.test(value)
      ? null
      : 'use lowercase kebab-case (letters, digits, and single hyphens).'
  });

  const localUrl = await askValue(prompt, logger, {
    key: 'localUrl',
    label: 'LocalWP URL',
    defaultValue: currentDefault(
      existingProject,
      action,
      (project) => project.environment?.localUrl,
      undefined
    ),
    validate: (value) => isHttpUrl(value)
      ? null
      : 'enter an absolute URL starting with http:// or https://.'
  });

  const productionUrl = await askValue(prompt, logger, {
    key: 'productionUrl',
    label: 'Production URL (optional)',
    defaultValue: currentDefault(
      existingProject,
      action,
      (project) => project.environment?.productionUrl,
      undefined
    ),
    optional: true,
    validate: (value) => value === null || isHttpUrl(value)
      ? null
      : 'leave empty or enter an absolute HTTP(S) URL.'
  });

  const figmaUrl = await askValue(prompt, logger, {
    key: 'figmaUrl',
    label: 'Figma design URL (optional)',
    defaultValue: currentDefault(
      existingProject,
      action,
      (project) => project.figma?.url,
      undefined
    ),
    optional: true,
    validate: (value) => value === null || isFigmaUrl(value)
      ? null
      : 'leave empty or enter an HTTPS URL on figma.com.'
  });

  const figmaRootNode = await askValue(prompt, logger, {
    key: 'figmaRootNode',
    label: 'Figma root/start node (optional)',
    defaultValue: currentDefault(
      existingProject,
      action,
      (project) => project.figma?.rootNode,
      undefined
    ),
    optional: true
  });

  const defaultLanguage = await askValue(prompt, logger, {
    key: 'defaultLanguage',
    label: 'Default language',
    defaultValue: currentDefault(
      existingProject,
      action,
      (project) => project.wordpress?.defaultLanguage,
      'pl'
    ),
    transform: (value) => value.toLowerCase(),
    validate: (value) => LANGUAGE_PATTERN.test(value)
      ? null
      : 'enter a language code such as pl, en, or de.'
  });

  const languageDefault = editing && Array.isArray(existingProject.wordpress?.languages)
    ? existingProject.wordpress.languages.join(', ')
    : defaultLanguage;
  const languages = await askValue(prompt, logger, {
    key: 'languages',
    label: 'Languages (comma or space separated)',
    defaultValue: languageDefault,
    transform: parseLanguages,
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'enter at least one language.';
      }
      if (value.some((language) => !LANGUAGE_PATTERN.test(language))) {
        return 'use language codes such as pl, en, or de.';
      }
      if (!value.includes(defaultLanguage)) {
        return `default language "${defaultLanguage}" must be included.`;
      }
      return null;
    }
  });

  const enabledByDefault = (id, fallback) => currentDefault(
    existingProject,
    action,
    (project) => capabilityIsEnabled(project, id),
    fallback
  );
  const acfDefault = currentDefault(
    existingProject,
    action,
    (project) => project.wordpress?.acfPro,
    enabledByDefault('acf', true)
  );

  const acfPro = await askBoolean(prompt, logger, 'acfPro', 'Use ACF Pro?', acfDefault);
  const contactForm7 = await askBoolean(
    prompt,
    logger,
    'contactForm7',
    'Use Contact Form 7?',
    enabledByDefault('cf7', false)
  );
  const polylang = await askBoolean(
    prompt,
    logger,
    'polylang',
    'Use Polylang?',
    enabledByDefault('polylang', false)
  );

  if (languages.length > 1 && !polylang) {
    logger.warn(
      'Warning: multiple languages selected without Polylang. The initializer will continue.'
    );
  }

  const woocommerce = await askBoolean(
    prompt,
    logger,
    'woocommerce',
    'Use WooCommerce?',
    enabledByDefault('woocommerce', false)
  );
  const googleMaps = await askBoolean(
    prompt,
    logger,
    'googleMaps',
    'Use Google Maps?',
    enabledByDefault('google-maps', false)
  );
  const blog = await askBoolean(
    prompt,
    logger,
    'blog',
    'Has blog/news section?',
    enabledByDefault('blog', false)
  );
  const swiper = await askBoolean(
    prompt,
    logger,
    'swiper',
    'Use Swiper?',
    enabledByDefault('swiper', true)
  );
  const aos = await askBoolean(
    prompt,
    logger,
    'aos',
    'Use AOS?',
    enabledByDefault('aos', false)
  );
  const lenis = await askBoolean(
    prompt,
    logger,
    'lenis',
    'Use smooth scrolling with Lenis?',
    enabledByDefault('lenis', false)
  );
  const topbar = await askBoolean(
    prompt,
    logger,
    'topbar',
    'Use topbar?',
    enabledByDefault('topbar', false)
  );
  const promoPopup = await askBoolean(
    prompt,
    logger,
    'promoPopup',
    'Use promo popup?',
    enabledByDefault('promo-popup', false)
  );

  const selections = [
    ['acf', acfPro],
    ['cf7', contactForm7],
    ['polylang', polylang],
    ['woocommerce', woocommerce],
    ['google-maps', googleMaps],
    ['swiper', swiper],
    ['aos', aos],
    ['lenis', lenis],
    ['blog', blog],
    ['topbar', topbar],
    ['promo-popup', promoPopup]
  ];
  const preservedCapabilities = editing
    ? (existingProject.capabilities?.enabled || []).filter(
      (id) => !MANAGED_CAPABILITIES.has(id)
    )
    : [];
  const enabledCapabilities = [
    ...selections.filter(([, enabled]) => enabled).map(([id]) => id),
    ...preservedCapabilities
  ];
  const existingSlug = existingProject.project?.slug;
  const existingPrefix = existingProject.project?.prefix;
  const prefix = editing && projectSlug === existingSlug && existingPrefix
    ? existingPrefix
    : slugToPrefix(projectSlug);
  const controlPlaneDefaults = editing
    ? existingProject
    : createNeutralManifest();

  return {
    $schema: controlPlaneDefaults.$schema,
    factoryVersion: controlPlaneDefaults.factoryVersion,
    mode: 'project',
    topology: editing ? existingProject.topology || 'auto' : 'auto',
    project: {
      name: projectName,
      slug: projectSlug,
      themeName,
      textDomain,
      prefix
    },
    environment: {
      localUrl,
      productionUrl
    },
    wordpress: {
      acfPro,
      languages,
      defaultLanguage
    },
    capabilities: {
      enabled: [...new Set(enabledCapabilities)]
    },
    figma: {
      url: figmaUrl,
      page: editing ? existingProject.figma?.page || null : null,
      rootNode: figmaRootNode
    },
    build: clone(controlPlaneDefaults.build)
  };
}

function restoreFile(filePath, existed, content) {
  if (existed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return;
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function writeConfiguration({
  project,
  projectPath,
  contextPath,
  initialProjectSource,
  initialProjectExists,
  initialContextSource,
  initialContextExists
}) {
  const currentProjectExists = fs.existsSync(projectPath);
  const currentProjectSource = currentProjectExists
    ? fs.readFileSync(projectPath, 'utf8')
    : null;
  const currentContextExists = fs.existsSync(contextPath);
  const currentContextSource = currentContextExists
    ? fs.readFileSync(contextPath, 'utf8')
    : null;

  if (currentProjectExists !== initialProjectExists
    || currentProjectSource !== initialProjectSource) {
    throw new Error('factory/project.json changed while the initializer was running. No files were written.');
  }

  if (currentContextExists !== initialContextExists
    || currentContextSource !== initialContextSource) {
    throw new Error('docs/factory/PROJECT_CONTEXT.md changed while the initializer was running. No files were written.');
  }

  generateProjectContext(project);
  fs.mkdirSync(path.dirname(projectPath), { recursive: true });

  try {
    fs.writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
    const savedProject = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    const savedValidationErrors = getValidationErrors(validateFactoryProject(savedProject));

    if (savedValidationErrors.length > 0) {
      throw new Error(`Saved project configuration is invalid:\n- ${savedValidationErrors.join('\n- ')}`);
    }

    writeProjectContext({ project: savedProject, outputPath: contextPath });
  } catch (error) {
    restoreFile(projectPath, initialProjectExists, initialProjectSource);
    restoreFile(contextPath, initialContextExists, initialContextSource);
    throw error;
  }
}

async function runInitializer({
  projectPath = FACTORY_PATHS.project,
  contextPath = DEFAULT_CONTEXT_PATH,
  prompt,
  logger = console,
  input = process.stdin,
  output = process.stdout
} = {}) {
  const initialProjectExists = fs.existsSync(projectPath);
  const initialProjectSource = initialProjectExists
    ? fs.readFileSync(projectPath, 'utf8')
    : null;
  const initialContextExists = fs.existsSync(contextPath);
  const initialContextSource = initialContextExists
    ? fs.readFileSync(contextPath, 'utf8')
    : null;
  let existingProject;

  try {
    existingProject = initialProjectExists
      ? JSON.parse(initialProjectSource)
      : createNeutralManifest();
  } catch (error) {
    throw new Error(`Cannot read existing project configuration: ${error.message}. No files were changed.`);
  }

  logger.log('MWStudios Website Factory');
  logger.log('Project initializer');
  logger.log('');

  const linePrompt = prompt ? null : createLinePrompt({ input, output });
  const activePrompt = prompt || linePrompt.prompt;

  try {
    let action = existingProject.mode === 'project' ? null : 'recreate';

    if (existingProject.mode === 'project') {
      logger.log('Existing project configuration detected.');
      logger.log('Choose: edit existing, recreate, or cancel.');
      action = await chooseExistingAction(activePrompt, logger);

      if (action === 'cancel') {
        logger.log('Initialization cancelled. No files were changed.');
        return { status: 'cancelled' };
      }

      logger.log('');
    }

    const project = await collectProjectConfiguration({
      prompt: activePrompt,
      logger,
      existingProject,
      action
    });
    const validationErrors = getValidationErrors(validateFactoryProject(project));

    if (validationErrors.length > 0) {
      throw new Error(`Project configuration is invalid:\n- ${validationErrors.join('\n- ')}`);
    }

    writeConfiguration({
      project,
      projectPath,
      contextPath,
      initialProjectSource,
      initialProjectExists,
      initialContextSource,
      initialContextExists
    });

    logger.log('');
    logger.log('Factory validation: FACTORY VALID');
    logger.log(`Project configuration saved: ${path.relative(ROOT_DIR, projectPath)}`);
    logger.log(`Project context generated: ${path.relative(ROOT_DIR, contextPath)}`);

    return { status: 'saved', project };
  } finally {
    if (linePrompt) {
      linePrompt.close();
    }
  }
}

async function main() {
  try {
    await runInitializer();
  } catch (error) {
    console.error(`Factory initialization failed: ${error.message}`);
    process.exitCode = error instanceof InputClosedError ? 130 : 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  InputClosedError,
  collectProjectConfiguration,
  createLinePrompt,
  createNeutralManifest,
  parseBoolean,
  parseLanguages,
  runInitializer,
  slugToPrefix,
  slugify,
  writeConfiguration
};
