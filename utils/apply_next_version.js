const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

// Compare current HEAD to upstream master SHA.
// If they are not equal - refuse to publish since
// we're not tip-of-tree.
const upstream_sha = `git ls-remote https://github.com/GoogleChrome/puppeteer --tags master | cut -f1`;
const current_sha = `git rev-parse HEAD`;
const command = `if [[ $(${upstream_sha}) == $(${current_sha}) ]]; then echo "yes"; else echo "no"; fi`;
const output = child_process.execSync(command).toString('utf8');
if (output.trim() !== 'yes') {
  console.log('REFUSING TO PUBLISH: this is not tip-of-tree!');
  process.exit(1);
  return;
}


const package = require('../package.json');
let version = package.version;
const dashIndex = version.indexOf('-');
if (dashIndex !== -1)
  version = version.substring(0, dashIndex);
version += '-next.' + Date.now();
console.log('Setting version to ' + version);
package.version = version;
fs.writeFileSync(path.join(__dirname, '..', 'package.json'), JSON.stringify(package, undefined, 2) + '\n');
