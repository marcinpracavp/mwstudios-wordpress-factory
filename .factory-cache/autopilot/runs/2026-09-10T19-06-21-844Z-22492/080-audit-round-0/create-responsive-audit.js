const fs = require('fs');
const path = require('path');

const comparisonRoot = path.resolve(__dirname, '../comparison-1789330359034');
const summary = JSON.parse(fs.readFileSync(path.join(comparisonRoot, 'summary.json'), 'utf8'));
const widths = [1440, 1280, 1024, 768, 390, 375];
const routes = summary.routes.map(({ id }) => ({
  id,
  widths: Object.fromEntries(widths.map((width) => {
    const data = JSON.parse(fs.readFileSync(path.join(comparisonRoot, id, `responsive-${width}.json`), 'utf8'));
    return [width, { viewportWidth: data.width, documentHeight: data.height, overflowPx: data.overflow, fontsReady: data.fontsReady, title: data.title, url: data.url }];
  }))
}));
const output = { comparison: 'comparison-1789330359034', generatedAt: new Date().toISOString(), routes };
fs.writeFileSync(path.join(__dirname, 'responsive-audit.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ output: path.join(__dirname, 'responsive-audit.json'), width375: routes.map((route) => ({ id: route.id, ...route.widths[375] })) }));
