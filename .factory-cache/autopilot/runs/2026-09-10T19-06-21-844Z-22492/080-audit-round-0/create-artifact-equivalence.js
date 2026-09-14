const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const previousId = 'comparison-1789327201418';
const currentId = 'comparison-1789330359034';
const previousRoot = path.join(root, previousId);
const currentRoot = path.join(root, currentId);
const previousSummary = JSON.parse(fs.readFileSync(path.join(previousRoot, 'summary.json'), 'utf8'));
const currentSummary = JSON.parse(fs.readFileSync(path.join(currentRoot, 'summary.json'), 'utf8'));
const equal = (left, right) => fs.readFileSync(left).equals(fs.readFileSync(right));
const routes = currentSummary.routes.map(({ id }) => {
  const previous = JSON.parse(fs.readFileSync(path.join(previousRoot, id, 'comparison.json'), 'utf8'));
  const current = JSON.parse(fs.readFileSync(path.join(currentRoot, id, 'comparison.json'), 'utf8'));
  return {
    id,
    referenceShaSame: previous.reference.sha256 === current.reference.sha256,
    renderedShaSame: previous.rendered.sha256 === current.rendered.sha256,
    diffPngSame: equal(path.join(previousRoot, id, 'diff.png'), path.join(currentRoot, id, 'diff.png')),
    responsivePngSame: Object.fromEntries([1440, 1280, 1024, 768, 390, 375].map((width) => [width, equal(path.join(previousRoot, id, `responsive-${width}.png`), path.join(currentRoot, id, `responsive-${width}.png`))]))
  };
});
const report = {
  previous: { id: previousId, capturedAt: previousSummary.capturedAt, implementationHash: previousSummary.implementationHash, sourceHash: previousSummary.sourceHash },
  current: { id: currentId, capturedAt: currentSummary.capturedAt, implementationHash: currentSummary.implementationHash, sourceHash: currentSummary.sourceHash },
  sameImplementationHash: previousSummary.implementationHash === currentSummary.implementationHash,
  sameSourceHash: previousSummary.sourceHash === currentSummary.sourceHash,
  routes
};
fs.writeFileSync(path.join(__dirname, 'artifact-equivalence.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.join(__dirname, 'artifact-equivalence.json'),
  desktopChanged: routes.filter((route) => !route.renderedShaSame).map((route) => route.id),
  responsiveChanged: routes.filter((route) => Object.values(route.responsivePngSame).some((same) => !same)).map((route) => route.id)
}));
