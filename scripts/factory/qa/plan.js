const fs = require('fs');
const path = require('path');

const { validateSnapshot } = require('../figma/validate-snapshot');
const { ROOT_DIR, readJson } = require('./utils');

function viewportIdForWidth(viewports, width) {
  const existing = viewports.find((viewport) => viewport.width === width);
  return existing ? existing.id : `figma-${width}`;
}

function sourceFrames(siteMap) {
  return (siteMap.pages || []).flatMap((page) => [
    ...(page.desktopSource.frames || []),
    ...(page.mobileSource.frames || [])
  ]);
}

function mergeViewports(qa, siteMap) {
  const viewports = qa.viewports.map((viewport) => ({ ...viewport }));
  sourceFrames(siteMap).forEach((frame) => {
    if (!viewports.some((viewport) => viewport.width === frame.width)) {
      viewports.push({
        id: `figma-${frame.width}`,
        width: frame.width,
        height: frame.height,
        source: 'figma'
      });
    }
  });
  return viewports;
}

function routeFromSitePage(page, viewports) {
  const referenceWidths = [
    ...(page.desktopSource.frames || []),
    ...(page.mobileSource.frames || [])
  ].map((frame) => frame.width);
  return {
    id: page.id,
    path: page.routeIntent,
    pageId: page.id,
    type: page.routeType,
    languages: { ...page.languageRoutes },
    referenceViewports: [...new Set(referenceWidths.map(
      (width) => viewportIdForWidth(viewports, width)
    ))],
    referenceMode: page.desktopSource.frames.length > 0 ? 'figma' : 'quality',
    managedBy: 'site-map'
  };
}

function validateResolvedRelationships(project, qa) {
  const errors = [];
  const routeIds = new Set(qa.routes.map((route) => route.id));
  const viewportIds = new Set(qa.viewports.map((viewport) => viewport.id));
  const projectLanguages = project.wordpress.languages || [];
  qa.routes.forEach((route) => {
    projectLanguages.forEach((language) => {
      if (!route.languages[language]) {
        errors.push(`route "${route.id}" is missing language path "${language}"`);
      }
    });
    route.referenceViewports.forEach((viewportId) => {
      if (!viewportIds.has(viewportId)) {
        errors.push(`route "${route.id}" references unknown viewport "${viewportId}"`);
      }
    });
  });
  (qa.interactions || []).forEach((recipe) => {
    if (!routeIds.has(recipe.route)) {
      errors.push(`interaction "${recipe.id}" references unknown route "${recipe.route}"`);
    }
    recipe.languages.forEach((language) => {
      if (!projectLanguages.includes(language)) {
        errors.push(`interaction "${recipe.id}" references unknown language "${language}"`);
      }
    });
    recipe.viewports.forEach((viewportId) => {
      if (!viewportIds.has(viewportId)) {
        errors.push(`interaction "${recipe.id}" references unknown viewport "${viewportId}"`);
      }
    });
  });
  return errors;
}

function resolveQaPlan({ project, qa, requireCompleteSnapshot = false } = {}) {
  const configuredSiteMap = qa.routePlan && qa.routePlan.siteMapPath;
  const siteMapPath = configuredSiteMap
    ? path.resolve(ROOT_DIR, configuredSiteMap)
    : null;
  const exists = siteMapPath && fs.existsSync(siteMapPath);
  if (!exists) {
    if (requireCompleteSnapshot) {
      throw new Error('QA route plan requires a validated site-map.json.');
    }
    return {
      qa,
      state: 'missing',
      topology: project.topology || 'auto',
      siteMap: null,
      errors: validateResolvedRelationships(project, qa)
    };
  }

  const validation = validateSnapshot({ project });
  if (validation.errors.length > 0) {
    if (requireCompleteSnapshot) {
      throw new Error(`QA route plan requires a valid complete snapshot:\n- ${validation.errors.join('\n- ')}`);
    }
    return {
      qa,
      state: 'invalid',
      topology: project.topology || 'auto',
      siteMap: readJson(siteMapPath),
      errors: validation.errors
    };
  }

  const siteMap = validation.siteMap;
  const viewports = mergeViewports(qa, siteMap);
  const manualRoutes = qa.routePlan.preserveManualRoutes
    ? qa.routes.filter((route) => route.managedBy === 'manual')
    : [];
  const routes = [
    ...siteMap.pages.map((page) => routeFromSitePage(page, viewports)),
    ...manualRoutes.filter((route) => !siteMap.pages.some((page) => page.id === route.id))
  ];
  const resolved = { ...qa, routes, viewports };
  return {
    qa: resolved,
    state: 'complete',
    topology: siteMap.topology,
    siteMap,
    errors: validateResolvedRelationships(project, resolved)
  };
}

function main() {
  try {
    const project = readJson(path.join(ROOT_DIR, 'factory', 'project.json'));
    const qa = readJson(path.join(ROOT_DIR, 'factory', 'qa.json'));
    const plan = resolveQaPlan({ project, qa });
    console.log('Factory QA plan');
    console.log(`State: ${plan.state.toUpperCase()}`);
    console.log(`Topology: ${String(plan.topology).toUpperCase()}`);
    console.log(`Routes: ${plan.qa.routes.map((route) => `${route.id}=${route.path}`).join(', ')}`);
    console.log(`Languages: ${Object.keys(plan.qa.languages).join(', ')}`);
    console.log(`Viewports: ${plan.qa.viewports.map((viewport) => viewport.width).join(', ')}`);
    console.log(`Interactions: ${(plan.qa.interactions || []).length}`);
    if (plan.errors.length > 0) {
      plan.errors.forEach((error) => console.log(`FAIL ${error}`));
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Factory QA plan failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  mergeViewports,
  resolveQaPlan,
  routeFromSitePage,
  validateResolvedRelationships
};
