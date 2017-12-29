let version = require('../package.json').version;
const dashIndex = version.indexOf('-');
if (dashIndex !== -1)
  version = version.substring(0, dashIndex);
version += '-next.' + Date.now();
console.log("Setting version to " + version);
require('child_process').execSync('npm version ' + version);