const fs = require('fs');
const path = require('path');

const { ROOT_DIR, relativeToRoot, writeJsonAtomic } = require('./utils');

function stageSymbol(status) {
  return {
    pending: 'PENDING',
    running: 'RUNNING',
    pass: 'PASS',
    failed: 'FAILED',
    blocked: 'BLOCKED',
    skipped: 'SKIPPED'
  }[status] || String(status || 'pending').toUpperCase();
}

function renderDashboard(configuration, state) {
  console.log('MWSTUDIOS WEBSITE FACTORY');
  console.log('FACTORY AUTOPILOT');
  console.log('');
  console.log(`Project: ${configuration.project.project.name}`);
  console.log(`Run: ${state ? state.runId : 'not started'}`);
  console.log(`Pipeline: ${state ? state.status.toUpperCase() : 'DRY RUN / NO STATE'}`);
  console.log('');
  configuration.autopilot.pipeline.forEach((stage) => {
    const status = state && state.stages[stage.id]
      ? state.stages[stage.id].status
      : 'pending';
    console.log(`${stage.label.padEnd(36, '.')} ${stageSymbol(status)}`);
  });
}

function writeAuditArtifact(result, state, label = 'Final visual audit') {
  const reportPath = path.join(ROOT_DIR, 'docs', 'factory', 'project', 'FINAL_VISUAL_AUDIT.md');
  const lines = [
    '# Factory Final Visual Audit',
    '',
    `Run ID: ${state.runId}`,
    `Updated: ${new Date().toISOString()}`,
    `Audit: ${label}`,
    `Result: ${result.status.toUpperCase()}`,
    '',
    '## Summary',
    '',
    result.summary,
    '',
    '## Findings',
    ''
  ];
  if (result.issues.length === 0) {
    lines.push('- No confirmed findings.');
  } else {
    result.issues.forEach((issue) => {
      lines.push(`- ${issue.severity} ${issue.id}: ${issue.message} Evidence: ${issue.evidence}`);
    });
  }
  if (result.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    result.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }
  lines.push('', 'This artifact was generated from a fresh ephemeral FINAL_REVIEWER session.');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  return reportPath;
}

function createFinalReport(configuration, state) {
  return {
    runId: state.runId,
    project: state.project,
    status: state.status,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    limits: configuration.autopilot.limits,
    blocker: state.blocker,
    stages: configuration.autopilot.pipeline.map((definition) => {
      const stage = state.stages[definition.id];
      return {
        id: stage.id,
        label: stage.label,
        status: stage.status,
        attempts: stage.totalAttempts || stage.attempts,
        repairAttempts: stage.repairAttempts,
        profile: stage.profile,
        resultPath: stage.resultPath,
        gateResults: stage.gateResults.map((gate) => ({
          id: gate.id,
          status: gate.status,
          exitCode: gate.exitCode,
          durationMs: gate.durationMs
        })),
        issues: stage.issues,
        warnings: stage.warnings
      };
    })
  };
}

function writeFinalReport(configuration, state, runPaths) {
  const report = createFinalReport(configuration, state);
  const jsonPath = path.join(runPaths.reports, 'final-report.json');
  writeJsonAtomic(jsonPath, report);

  const trackedPath = path.join(ROOT_DIR, 'docs', 'factory', 'project', 'AUTOPILOT_REPORT.md');
  const lines = [
    '# Website Factory Autopilot Report',
    '',
    `Run ID: ${state.runId}`,
    `Project: ${state.project.name}`,
    `Result: ${state.status.toUpperCase()}`,
    `Started: ${state.startedAt}`,
    `Completed: ${state.completedAt || 'Not completed'}`,
    '',
    '| Stage | Status | Attempts | Repairs | Profile |',
    '| --- | --- | ---: | ---: | --- |'
  ];
  report.stages.forEach((stage) => {
    lines.push(`| ${stage.label} | ${stage.status.toUpperCase()} | ${stage.attempts} | ${stage.repairAttempts} | ${stage.profile || '-'} |`);
  });
  if (state.blocker) {
    lines.push('', '## Blocker', '', state.blocker.reason);
  }
  lines.push('', `Compact JSON: \`${relativeToRoot(jsonPath)}\``);
  fs.mkdirSync(path.dirname(trackedPath), { recursive: true });
  fs.writeFileSync(trackedPath, `${lines.join('\n')}\n`, 'utf8');
  return { jsonPath, trackedPath };
}

module.exports = {
  createFinalReport,
  renderDashboard,
  stageSymbol,
  writeAuditArtifact,
  writeFinalReport
};
