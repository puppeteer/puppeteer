module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Chromium-specific tests', function() {
    describe('Browser.version', function() {
      xit('should return whether we are in headless', async({browser}) => {
        const version = await browser.version();
        expect(version.length).toBeGreaterThan(0);
        expect(version.startsWith('Headless')).toBe(headless);
      });
    });

    describe('Browser.userAgent', function() {
      it('should include WebKit', async({browser}) => {
        const userAgent = await browser.userAgent();
        expect(userAgent.length).toBeGreaterThan(0);
        expect(userAgent).toContain('WebKit');
      });
    });
  });
};

