// Client runtime adapter: target the isolated CB preview stack, not /wordpress.
const { spawnSync } = require('child_process');
const path = require('path');
const config = require('../../../docs/projects/collegium-balticum/live.json');
const root = path.resolve(__dirname,'../../..');
const [command,...args] = process.argv.slice(2);
const compose = ['compose','-p','factory-live-qa','-f','.devcontainer/docker-compose.yml'];
let executable, parameters;
if (command === 'wp') {
  executable = 'docker'; parameters = [...compose,'exec','-T','wpcli','wp',...args];
} else if (command === 'preview') {
  executable = 'docker'; parameters = [...compose,'exec','-T','wpcli','wp','eval-file','/var/www/html/wp-content/themes/mwstudios-wordpress-factory/tests/factory/preview-setup.php'];
} else if (command === 'dev') {
  executable = 'npm'; parameters = ['run','dev:watch'];
} else {
  console.error('Usage: runtime.js wp <WP-CLI args> | preview | dev'); process.exit(1);
}
const result = spawnSync(executable,parameters,{cwd:root,stdio:'inherit',env:{...process.env,FACTORY_LOCAL_URL:config.localUrl}});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
