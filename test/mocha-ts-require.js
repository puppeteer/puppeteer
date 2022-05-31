const path = require('path');

require('ts-node').register({
  /**
   * We ignore the lib/ directory because that's already been TypeScript
   * compiled and checked. So we don't want to check it again as part of running
   * the unit tests.
   */
  ignore: ['lib/*', 'node_modules'],
  project: path.join(__dirname, 'tsconfig.test.json'),
});
