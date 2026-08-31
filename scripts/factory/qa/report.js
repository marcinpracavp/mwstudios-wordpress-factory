const fs = require('fs');
const path = require('path');

function resultStatus(result) {
  return result.errors.length === 0 ? 'PASS' : 'FAIL';
}

function renderTerminalSummary(summary) {
  console.log('Website Factory QA');
  console.log('');
  console.log(`Browser: ${summary.browser.name} (${summary.browser.executablePath})`);
  console.log(`Project: ${summary.project.name}`);
  console.log(`Base URL: ${summary.baseUrl}`);
  console.log('');

  summary.checks.forEach((result) => {
    const label = `${result.language.toUpperCase()} / ${result.route} / ${result.viewport.id} ${result.viewport.width}`;
    console.log(label);
    console.log(`${result.checks.http?.status === 'PASS' ? '✓' : '✗'} HTTP${result.checks.http?.statusCode ? ` ${result.checks.http.statusCode}` : ''}`);
    console.log(`${result.checks.screenshot?.status === 'PASS' ? '✓' : '✗'} screenshot`);
    const overflow = result.checks.horizontalOverflow;
    console.log(`${overflow?.status === 'PASS' ? '✓' : '✗'} no horizontal overflow${overflow?.status === 'FAIL' ? ` (+${overflow.delta}px)` : ''}`);
    const consoleCheck = result.checks.console;
    console.log(`${consoleCheck?.status === 'PASS' ? '✓' : '✗'} ${consoleCheck?.errorCount || 0} console errors, ${consoleCheck?.warningCount || 0} warnings, ${consoleCheck?.pageErrorCount || 0} page errors`);
    const brokenAssets = result.checks.brokenAssets;
    console.log(`${brokenAssets?.status === 'PASS' ? '✓' : '✗'} ${brokenAssets?.count || 0} broken assets`);
    console.log(`✓ ${result.sectionCount || 0} sections`);
    result.warnings.forEach((warning) => console.log(`! ${warning.message}`));
    console.log('');
  });

  console.log(summary.errors.length === 0 ? 'QA COMPLETE' : 'QA FAILED');
}

function renderTrackedReport(summary) {
  const lines = [
    '# Website Factory QA Report',
    '',
    `Last QA run: ${summary.generatedAt}`,
    '',
    `Browser: ${summary.browser.name} (${summary.browser.executablePath})`,
    '',
    `Project: ${summary.project.name}`,
    '',
    `Base URL: ${summary.baseUrl}`,
    '',
    `Result: ${summary.errors.length === 0 ? 'PASS' : 'FAIL'}`,
    '',
    '| Language | Route | Viewport | Result | Overflow | Console errors | Broken assets | Sections |',
    '| --- | --- | --- | --- | --- | ---: | ---: | ---: |'
  ];

  summary.checks.forEach((result) => {
    const overflow = result.checks.horizontalOverflow || {};
    const consoleCheck = result.checks.console || {};
    const brokenAssets = result.checks.brokenAssets || {};
    lines.push(
      `| ${result.language.toUpperCase()} | ${result.route} | ${result.viewport.id} (${result.viewport.width}×${result.viewport.height}) | ${resultStatus(result)} | ${overflow.status === 'FAIL' ? `FAIL +${overflow.delta}px` : 'PASS'} | ${consoleCheck.errorCount || 0} | ${brokenAssets.count || 0} | ${result.sectionCount || 0} |`
    );
  });

  if (summary.errors.length > 0) {
    lines.push('', '## Failed checks', '');
    summary.errors.slice(0, 20).forEach((error) => lines.push(`- ${error.type}: ${error.message}`));
  }

  lines.push('', 'Screenshots and detailed JSON are local-only in `.factory-cache/qa/latest/`.');
  return `${lines.join('\n')}\n`;
}

function writeTrackedReport(rootDir, summary) {
  const reportPath = path.join(rootDir, 'docs', 'factory', 'project', 'QA_REPORT.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderTrackedReport(summary), 'utf8');
  return reportPath;
}

module.exports = {
  renderTerminalSummary,
  renderTrackedReport,
  writeTrackedReport
};
