const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./test/TestSuites.json', 'utf-8'));

/**
 * @param {string} platform
 * @returns {string}
 */
function mapPlatform(platform) {
  switch (platform) {
    case 'linux':
      return 'ubuntu-latest';
    case 'win32':
      return 'windows-latest';
    case 'darwin':
      return 'macos-latest';
    default:
      throw new Error('Unsupported platform');
  }
}

const result = [];
for (const suite of data.testSuites) {
  for (const platform of suite.platforms) {
    if (platform === 'linux' && suite.id !== 'firefox-bidi') {
      for (const node of [14, 16, 18]) {
        result.push(`- name: ${suite.id}
  machine: ${mapPlatform(platform)}
  xvfb: true
  node: ${node}
  suite: ${suite.id}`);
      }
    } else {
      result.push(`- name: ${suite.id}
  machine: ${mapPlatform(platform)}
  xvfb: ${platform === 'linux'}
  node: 18
  suite: ${suite.id}`);
    }
  }
}

console.log(result.join('\n'));
