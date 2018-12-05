module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Firefox-specific tests', function() {
    describe('Browser.version', function() {
      it('should return whether we are in headless', async({browser}) => {
        const version = await browser.version();
        expect(version.length).toBeGreaterThan(0);
        expect(version.startsWith('Firefox/')).toBe(true);
      });
    });

    describe('Browser.userAgent', function() {
      it('should include WebKit', async({browser}) => {
        const userAgent = await browser.userAgent();
        expect(userAgent.length).toBeGreaterThan(0);
        expect(userAgent).toContain('Gecko');
      });
    });
  });
};

