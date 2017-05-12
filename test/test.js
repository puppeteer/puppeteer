var Browser = require('../lib/Browser');

describe('Page', function() {
    var browser;
    var page;

    beforeAll(function() {
        browser = new Browser();
    });

    afterAll(function() {
        browser.close();
    });

    beforeEach(SX(async function() {
        page = await browser.newPage();
    }));

    afterEach(function() {
        page.close();
    });

    it('Page.evaluate', SX(async function() {
        var result = await page.evaluate(() => 7 * 3);
        expect(result).toBe(21);
    }));

    it('Page.evaluateAsync', SX(async function() {
        var result = await page.evaluateAsync(() => Promise.resolve(8 * 7));
        expect(result).toBe(56);
    }));
});

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
    return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
