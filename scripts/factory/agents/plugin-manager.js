const fs = require('fs');
const path = require('path');

const { inProcessGate, runCommand } = require('./command-runner');
const { resolveLocalWpToolchain } = require('../toolchain');
const { ROOT_DIR, readJson, relativeToRoot, resolveInside } = require('./utils');

const SITE_MAP_PATH = path.join(ROOT_DIR, '.factory-cache', 'figma', 'latest', 'site-map.json');
const MANIFEST_PATH = path.join(ROOT_DIR, '.factory-cache', 'figma', 'latest', 'manifest.json');

function findWordPressRoot() {
  return resolveLocalWpToolchain().wordpressRoot;
}

function discoveredPluginCapabilities() {
  if (!fs.existsSync(SITE_MAP_PATH) || !fs.existsSync(MANIFEST_PATH)) {
    return [];
  }
  const manifest = readJson(MANIFEST_PATH);
  if (manifest.status !== 'complete') {
    return [];
  }
  const siteMap = readJson(SITE_MAP_PATH);
  return (siteMap.capabilities || [])
    .filter((capability) => capability.required && capability.pluginCapability)
    .map((capability) => capability.pluginCapability);
}

function requiredPlugins(configuration) {
  const enabled = new Set(configuration.project.capabilities.enabled || []);
  discoveredPluginCapabilities().forEach((capability) => enabled.add(capability));
  if (configuration.project.wordpress.acfPro) {
    enabled.add('acf');
  }
  return configuration.plugins.plugins.filter((plugin) => enabled.has(plugin.capability));
}

function wpResult(invocation, wordpressRoot, id, args) {
  return runCommand({
    id,
    command: invocation.command,
    args: [...invocation.argsPrefix, ...args, `--path=${wordpressRoot}`]
  });
}

function pluginCheckState(invocation, wordpressRoot, slug, check) {
  const result = wpResult(invocation, wordpressRoot, `plugin-${check}:${slug}`, [
    'plugin',
    check === 'installed' ? 'is-installed' : 'is-active',
    slug
  ]);
  if (result.status === 'pass') {
    return true;
  }
  const output = `${result.stdout}\n${result.stderr}`;
  if (/not installed|is not installed/i.test(output) || output.trim() === '') {
    return false;
  }
  return null;
}

function pluginIsInstalled(invocation, wordpressRoot, slug) {
  return pluginCheckState(invocation, wordpressRoot, slug, 'installed');
}

function pluginIsActive(invocation, wordpressRoot, slug) {
  return pluginCheckState(invocation, wordpressRoot, slug, 'active');
}

function commercialPackage(plugin, wordpressRoot) {
  const configured = plugin.packageCandidates.map((candidate) => resolveInside(ROOT_DIR, candidate));
  const conventional = [
    path.join(wordpressRoot, 'wp-content', 'plugins', `${plugin.slug}.zip`),
    path.join(wordpressRoot, 'wp-content', 'plugin-packages', `${plugin.slug}.zip`)
  ];
  return [...configured, ...conventional].find((candidate) => fs.existsSync(candidate)) || null;
}

function inspectPluginPlan(configuration, providedToolchain) {
  const toolchain = providedToolchain || resolveLocalWpToolchain();
  const wordpressRoot = toolchain.wordpressRoot;
  const invocation = toolchain.wpCli.available ? toolchain.wpCli : null;
  const requirements = requiredPlugins(configuration);
  const supported = new Set(configuration.plugins.plugins.map((plugin) => plugin.capability));
  const unsupportedCapabilities = discoveredPluginCapabilities()
    .filter((capability) => !supported.has(capability));
  return {
    wordpressRoot,
    toolchain,
    wpCommand: invocation ? invocation.display : null,
    wpInvocation: invocation,
    unsupportedCapabilities,
    requirements: requirements.map((plugin) => {
      const pluginDirectory = wordpressRoot
        ? path.join(wordpressRoot, 'wp-content', 'plugins', plugin.slug)
        : null;
      const installed = wordpressRoot
        ? (fs.existsSync(pluginDirectory)
          || (invocation ? pluginIsInstalled(invocation, wordpressRoot, plugin.slug) : false))
        : null;
      return {
        capability: plugin.capability,
        name: plugin.name,
        slug: plugin.slug,
        source: plugin.source,
        installed,
        active: invocation && wordpressRoot
          ? pluginIsActive(invocation, wordpressRoot, plugin.slug)
          : null,
        localPackage: plugin.source === 'commercial-local-package' && wordpressRoot
          ? commercialPackage(plugin, wordpressRoot)
          : null,
        licenseConfiguredByBoilerplate: plugin.capability === 'acf'
          ? plugin.licenseConfiguredByBoilerplate === true
          : null
      };
    })
  };
}

function ensureRequiredPlugins(configuration) {
  const plan = inspectPluginPlan(configuration);
  const actions = [];
  const errors = [];

  if (!plan.wordpressRoot) {
    return {
      gate: inProcessGate('required-plugins', false, 'WordPress root was not found.'),
      plan,
      actions,
      errors: ['WordPress root was not found.']
    };
  }
  if (plan.unsupportedCapabilities.length > 0) {
    const message = `No Factory plugin strategy exists for discovered plugin capability: ${plan.unsupportedCapabilities.join(', ')}.`;
    return {
      gate: inProcessGate('required-plugins', false, message),
      plan,
      actions,
      errors: [message]
    };
  }
  if (plan.requirements.length === 0) {
    return {
      gate: inProcessGate('required-plugins', true, 'No WordPress plugin action is required.'),
      plan,
      actions,
      errors
    };
  }
  if (!plan.wpInvocation) {
    const unresolved = plan.requirements.filter((requirement) => requirement.active !== true);
    if (unresolved.length > 0) {
      const message = `WP-CLI is unavailable and ${unresolved.length} required plugin activation/install state(s) need a WordPress action.`;
      return {
        gate: inProcessGate('required-plugins', false, message),
        plan,
        actions,
        errors: [message]
      };
    }
  }

  plan.requirements.forEach((requirement) => {
    if (requirement.active) {
      actions.push({ slug: requirement.slug, action: 'none', status: 'already-active' });
      return;
    }

    let result;
    if (requirement.installed) {
      result = wpResult(plan.wpInvocation, plan.wordpressRoot, `plugin-activate:${requirement.slug}`, [
        'plugin',
        'activate',
        requirement.slug
      ]);
      actions.push({ slug: requirement.slug, action: 'activate', result });
    } else if (requirement.source === 'wordpress.org') {
      result = wpResult(plan.wpInvocation, plan.wordpressRoot, `plugin-install:${requirement.slug}`, [
        'plugin',
        'install',
        requirement.slug,
        '--activate'
      ]);
      actions.push({ slug: requirement.slug, action: 'install-and-activate', result });
    } else if (requirement.localPackage) {
      result = wpResult(plan.wpInvocation, plan.wordpressRoot, `plugin-install:${requirement.slug}`, [
        'plugin',
        'install',
        requirement.localPackage,
        '--activate'
      ]);
      actions.push({
        slug: requirement.slug,
        action: 'install-local-package-and-activate',
        package: relativeToRoot(requirement.localPackage),
        result
      });
    } else {
      errors.push(`${requirement.name} plugin binary/package is missing. ACF Pro licensing is preconfigured by the boilerplate and is not the blocker.`);
      actions.push({ slug: requirement.slug, action: 'blocked-missing-commercial-package' });
      return;
    }

    if (pluginIsActive(plan.wpInvocation, plan.wordpressRoot, requirement.slug) !== true) {
      errors.push(`${requirement.name} is not active after the requested WP-CLI action.`);
    }
  });

  return {
    gate: inProcessGate(
      'required-plugins',
      errors.length === 0,
      errors.length === 0
        ? `${plan.requirements.length} required plugin(s) verified active.`
        : errors.join('\n')
    ),
    plan,
    actions,
    errors
  };
}

module.exports = {
  discoveredPluginCapabilities,
  ensureRequiredPlugins,
  findWordPressRoot,
  inspectPluginPlan,
  requiredPlugins,
  wpResult
};
