const {writeFileSync, readFileSync} = require('fs');
const {join} = require('path');

writeFileSync(
  join(__dirname, '../src/generated/version.ts'),
  readFileSync(join(__dirname, '../src/templates/version.ts.tmpl'), {
    encoding: 'utf-8',
  }).replace('PACKAGE_VERSION', require('../package.json').version)
);
