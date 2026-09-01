const { loadAgentConfiguration, validateAgentConfiguration } = require('./config');
const { validateConventions } = require('./conventions');

function validateAutopilot() {
  const configuration = loadAgentConfiguration();
  const configurationErrors = validateAgentConfiguration(configuration);
  const conventionIssues = validateConventions();
  return { configuration, configurationErrors, conventionIssues };
}

function main() {
  try {
    const result = validateAutopilot();
    console.log('Factory Autopilot validation');
    console.log('');
    if (result.configurationErrors.length === 0) {
      console.log('PASS agent configuration, profiles, prompts, schemas, and pipeline references');
    } else {
      result.configurationErrors.forEach((error) => console.log(`FAIL ${error}`));
    }
    if (result.conventionIssues.length === 0) {
      console.log('PASS spacing utility, one-page-one-style-file, and SCSS format policies');
    } else {
      result.conventionIssues.forEach((issue) => {
        console.log(`FAIL ${issue.code} ${issue.file}:${issue.line} ${issue.message}`);
      });
    }
    const valid = result.configurationErrors.length === 0 && result.conventionIssues.length === 0;
    console.log('');
    console.log(valid ? 'FACTORY AUTOPILOT VALID' : 'FACTORY AUTOPILOT INVALID');
    process.exitCode = valid ? 0 : 1;
  } catch (error) {
    console.log('Factory Autopilot validation');
    console.log('');
    console.log(`FAIL ${error.message}`);
    console.log('');
    console.log('FACTORY AUTOPILOT INVALID');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateAutopilot };
