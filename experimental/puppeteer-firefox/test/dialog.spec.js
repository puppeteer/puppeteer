const utils = require('./utils');

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('Page.Events.Dialog', function() {
    it('should fire', async({page, server}) => {
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('alert');
        expect(dialog.defaultValue()).toBe('');
        expect(dialog.message()).toBe('yo');
        dialog.accept();
      });
      await page.evaluate(() => alert('yo'));
    });
    it('should allow accepting prompts', async({page, server}) => {
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.defaultValue()).toBe('yes.');
        expect(dialog.message()).toBe('question?');
        dialog.accept('answer!');
      });
      const result = await page.evaluate(() => prompt('question?', 'yes.'));
      expect(result).toBe('answer!');
    });
    it('should dismiss the prompt', async({page, server}) => {
      page.on('dialog', dialog => {
        dialog.dismiss();
      });
      const result = await page.evaluate(() => prompt('question?'));
      expect(result).toBe(null);
    });
  });
};
