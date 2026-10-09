const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { ROOT, hash, inside } = require('../autopilot/common');
const schema = require('../../../factory/schemas/live.schema.json');
const checks = ['referenceCapture', 'localPage', 'template', 'content', 'visualQA', 'wcagQA'];
function loadConfig(file) {
  if (!file) throw Error('LIVE_CONFIG_REQUIRED: --config <file>');
  const config = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const validate = new Ajv({ allErrors: true }).compile(schema);
  if (!validate(config)) throw Error(`LIVE_CONFIG_INVALID: ${JSON.stringify(validate.errors)}`);
  for (const key of ['sourceUrl', 'localUrl']) {
    const u = new URL(config[key]);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw Error(`INVALID_BASE_URL: ${key}`);
  }
  for (const list of [config.routes, config.viewports]) {
    if (new Set(list.map(x => x.id)).size !== list.length) throw Error('DUPLICATE_ID');
  }
  if (new Set(config.routes.map(x => x.path)).size !== config.routes.length) throw Error('DUPLICATE_PATH');
  for (const route of config.routes) {
    if (!route.path.startsWith('/') || route.path.startsWith('//') || /[?#\\\s]/.test(route.path)
      || new URL(route.path, config.sourceUrl).pathname !== route.path) throw Error(`INVALID_ROUTE_PATH: ${route.path}`);
  }
  const output = inside(ROOT, config.reportDir);
  if (path.relative(ROOT, output).split(path.sep)[0] !== '.factory-cache') throw Error('REPORT_DIR_MUST_BE_IN_FACTORY_CACHE');
  return { config, output, configHash: hash(JSON.stringify(config)) };
}
function url(base, route) { return `${base.replace(/\/$/, '')}${route}`; }
function select(list, ids, kind) {
  if (!ids) return list;
  const values = ids.split(',');
  if (values.some(id => !list.some(x => x.id === id))) throw Error(`UNKNOWN_${kind}: ${ids}`);
  return list.filter(x => values.includes(x.id));
}
module.exports = { loadConfig, checks, url, select };
