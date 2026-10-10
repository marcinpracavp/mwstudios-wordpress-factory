/** Explicit CB production build; factory webpack defaults remain untouched. */
const config = require('../../../webpack.config');
const cssnano = require('cssnano');
for (const rule of config.module.rules) {
  for (const loader of Array.isArray(rule.use) ? rule.use : []) {
    if (loader.loader === 'postcss-loader') {
      loader.options.postcssOptions.plugins.push(cssnano({ preset: ['default', { discardUnused: false }] }));
    }
  }
}
module.exports = config;
