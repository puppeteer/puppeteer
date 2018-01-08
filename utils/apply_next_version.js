const path = require('path');
const fs = require('fs');

const package = require('../package.json');
let version = package.version;
const dashIndex = version.indexOf('-');
if (dashIndex !== -1)
  version = version.substring(0, dashIndex);
version += '-next.' + Date.now();
console.log('Setting version to ' + version);
package.version = version;
fs.writeFileSync(path.join(__dirname, '..', 'package.json'), JSON.stringify(package, undefined, 2) + '\n');