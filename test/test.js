var path = require('path');
var Browser = require('../lib/Browser');

var EMPTY_PAGE = 'file://' + path.join(__dirname, 'assets', 'empty.html');

describe('Puppeteer', function() {
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

    describe('Page.setInPageCallback', function() {
        it('should work', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return a * b;
            });

            var result = await page.evaluate(function() {
                return callController(9, 4);
            });
            expect(result).toBe(36);
        }));
        it('should survive navigation', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return a * b;
            });

            await page.navigate(EMPTY_PAGE);
            var result = await page.evaluate(function() {
                return callController(9, 4);
            });
            expect(result).toBe(36);
        }));
    });
});

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
    return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
