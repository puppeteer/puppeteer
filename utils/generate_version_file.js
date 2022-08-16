const {writeFileSync, readFileSync} = require('fs');
const {join} = require('path');

const version = require('../package.json').version;

writeFileSync(
  join(__dirname, '../src/generated/version.ts'),
  readFileSync(join(__dirname, '../src/templates/version.ts.tmpl'), {
    encoding: 'utf-8',
  }).replace('PACKAGE_VERSION', version)
);

writeFileSync(
  join(__dirname, '../versions.js'),
  readFileSync(join(__dirname, '../versions.js'), {
    encoding: 'utf-8',
  }).replace('NEXT', `v${version}`)
);
