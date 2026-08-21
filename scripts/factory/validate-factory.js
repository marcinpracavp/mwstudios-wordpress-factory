const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const FACTORY_PATHS = {
  project: path.join(ROOT_DIR, 'factory', 'project.json'),
  capabilities: path.join(ROOT_DIR, 'factory', 'capabilities.json'),
  projectSchema: path.join(ROOT_DIR, 'factory', 'schemas', 'project.schema.json'),
  capabilitiesSchema: path.join(ROOT_DIR, 'factory', 'schemas', 'capabilities.schema.json')
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatSchemaErrors(scope, errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || '/';
    const missingProperty = error.params?.missingProperty
      ? ` (${error.params.missingProperty})`
      : '';

    return `${scope} ${location}: ${error.message}${missingProperty}`;
  });
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return [...duplicates];
}

function validateFactory({ project, registry, projectSchema, capabilitiesSchema }) {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validateProjectSchema = ajv.compile(projectSchema);
  const validateCapabilitiesSchema = ajv.compile(capabilitiesSchema);
  const checks = [];

  const projectIsValid = validateProjectSchema(project);
  checks.push({
    label: 'project manifest',
    errors: projectIsValid
      ? []
      : formatSchemaErrors('project manifest', validateProjectSchema.errors)
  });

  const registrySchemaIsValid = validateCapabilitiesSchema(registry);
  const registryErrors = registrySchemaIsValid
    ? []
    : formatSchemaErrors('capability registry', validateCapabilitiesSchema.errors);
  const registryItems = Array.isArray(registry.capabilities) ? registry.capabilities : [];
  const registryIds = registryItems.map((capability) => capability.id);
  const duplicateIds = findDuplicates(registryIds);

  duplicateIds.forEach((id) => {
    registryErrors.push(`duplicate capability id "${id}"`);
  });

  const registryIdSet = new Set(registryIds);
  registryItems.forEach((capability) => {
    const dependencies = Array.isArray(capability.dependencies)
      ? capability.dependencies
      : [];

    dependencies.forEach((dependency) => {
      if (!registryIdSet.has(dependency)) {
        registryErrors.push(
          `capability "${capability.id}" references unknown dependency "${dependency}"`
        );
      }
    });
  });

  if (project.factoryVersion !== registry.factoryVersion) {
    registryErrors.push(
      `factoryVersion mismatch: project uses "${project.factoryVersion}" and registry uses "${registry.factoryVersion}"`
    );
  }

  const enabled = Array.isArray(project.capabilities?.enabled)
    ? project.capabilities.enabled
    : [];

  enabled.forEach((id) => {
    if (!registryIdSet.has(id)) {
      registryErrors.push(`enabled capability "${id}" does not exist in registry`);
    }
  });

  checks.push({ label: 'capability registry', errors: registryErrors });

  const identifierErrors = [];
  const projectData = project.project || {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const prefixPattern = /^[a-z][a-z0-9_]*$/;

  if (typeof projectData.name !== 'string' || projectData.name.trim() === '') {
    identifierErrors.push('project name must be a non-empty string');
  }
  if (!slugPattern.test(projectData.slug || '')) {
    identifierErrors.push('project slug must contain lowercase letters, digits, and single hyphens only');
  }
  if (!slugPattern.test(projectData.textDomain || '')) {
    identifierErrors.push('project textDomain must contain lowercase letters, digits, and single hyphens only');
  }
  if (!prefixPattern.test(projectData.prefix || '')) {
    identifierErrors.push('project prefix must be a PHP-safe lowercase identifier without hyphens');
  }

  checks.push({ label: 'project identifiers', errors: identifierErrors });

  const requiredErrors = [];
  registryItems
    .filter((capability) => capability.required === true)
    .forEach((capability) => {
      if (!enabled.includes(capability.id)) {
        requiredErrors.push(`required capability "${capability.id}" is not enabled`);
      }
    });
  checks.push({ label: 'required capabilities', errors: requiredErrors });

  const dependencyErrors = [];
  registryItems
    .filter((capability) => enabled.includes(capability.id))
    .forEach((capability) => {
      const dependencies = Array.isArray(capability.dependencies)
        ? capability.dependencies
        : [];

      dependencies.forEach((dependency) => {
        if (!enabled.includes(dependency)) {
          dependencyErrors.push(`capability "${capability.id}" requires "${dependency}"`);
        }
      });
    });
  checks.push({ label: 'capability dependencies', errors: dependencyErrors });

  const languageErrors = [];
  const languages = Array.isArray(project.wordpress?.languages)
    ? project.wordpress.languages
    : [];
  const defaultLanguage = project.wordpress?.defaultLanguage;

  if (!languages.includes(defaultLanguage)) {
    languageErrors.push(`defaultLanguage "${defaultLanguage}" is not present in languages`);
  }
  checks.push({ label: 'languages', errors: languageErrors });

  const environmentErrors = [];
  const localUrl = project.environment?.localUrl;
  if (localUrl !== null && !/^https?:\/\/[^\s]+$/.test(localUrl || '')) {
    environmentErrors.push('environment localUrl must be null or an absolute HTTP(S) URL');
  }
  checks.push({ label: 'environment', errors: environmentErrors });

  const figmaErrors = [];
  const figma = project.figma || {};
  if (project.mode === 'project') {
    ['url', 'page', 'rootNode'].forEach((property) => {
      if (typeof figma[property] !== 'string' || figma[property].trim() === '') {
        figmaErrors.push(`Figma ${property} is required when mode is "project"`);
      }
    });
  }
  checks.push({ label: 'Figma configuration', errors: figmaErrors });

  const releaseErrors = [];
  const release = project.build?.release || {};
  const requiredReleaseFlags = [
    'includeDist',
    'includeSource',
    'includeVendor',
    'excludeNodeModules',
    'excludeGit'
  ];

  if (project.build?.distStrategy !== 'local-release-artifact') {
    releaseErrors.push('build distStrategy must be "local-release-artifact"');
  }

  requiredReleaseFlags.forEach((flag) => {
    if (release[flag] !== true) {
      releaseErrors.push(`build release ${flag} must be true`);
    }
  });

  checks.push({ label: 'release contract', errors: releaseErrors });

  return checks;
}

function renderReport(checks) {
  console.log('Website Factory validation');
  console.log('');

  checks.forEach((check) => {
    if (check.errors.length === 0) {
      console.log(`✓ ${check.label}`);
      return;
    }

    check.errors.forEach((error) => {
      console.log(`✗ ${error}`);
    });
  });

  const valid = checks.every((check) => check.errors.length === 0);
  console.log('');
  console.log(valid ? 'FACTORY VALID' : 'FACTORY INVALID');

  return valid;
}

function main() {
  try {
    const checks = validateFactory({
      project: readJson(FACTORY_PATHS.project),
      registry: readJson(FACTORY_PATHS.capabilities),
      projectSchema: readJson(FACTORY_PATHS.projectSchema),
      capabilitiesSchema: readJson(FACTORY_PATHS.capabilitiesSchema)
    });

    process.exitCode = renderReport(checks) ? 0 : 1;
  } catch (error) {
    console.log('Website Factory validation');
    console.log('');
    console.log(`✗ ${error.message}`);
    console.log('');
    console.log('FACTORY INVALID');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  renderReport,
  validateFactory
};
