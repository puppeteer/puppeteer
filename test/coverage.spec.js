const {helper} = require('../lib/helper');

module.exports.addTests = function({
  describe, xdescribe, fdescribe, it, fit, xit, beforeAll, beforeEach, afterAll, afterEach
}, expect, defaultBrowserOptions, puppeteer, PROJECT_ROOT) {

  if (process.env.COVERAGE) {
    describe('COVERAGE', function(){
      const coverage = helper.publicAPICoverage();
      const disabled = new Set(['page.bringToFront']);
      if (!defaultBrowserOptions.headless)
        disabled.add('page.pdf');

      for (const method of coverage.keys()) {
        (disabled.has(method) ? xit : it)(`public api '${method}' should be called`, async({page, server}) => {
          expect(coverage.get(method)).toBe(true);
        });
      }
    });
  }
};