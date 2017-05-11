var webpage = require('webpage');

async_test(function () {
    var page = webpage.create();
    page.open(TEST_HTTP_BASE + 'includejs1.html',
              this.step_func(function (status) {
        assert_equals(status, 'success');
        page.includeJs(TEST_HTTP_BASE + 'includejs.js',
                       this.step_func_done(function () {
            var title = page.evaluate('getTitle');
            assert_equals(title, 'i am includejs one');
        }));
    }));

}, "including JS in a page");

async_test(function () {
    var page = webpage.create();
    var already = false;
    page.open(TEST_HTTP_BASE + 'includejs1.html',
              this.step_func(function (status) {
        assert_equals(status, 'success');
        page.includeJs(TEST_HTTP_BASE + 'includejs.js',
                       this.step_func(function () {
            assert_is_false(already);
            already = true;
            var title = page.evaluate('getTitle');
            assert_equals(title, 'i am includejs one');
            page.open(TEST_HTTP_BASE + 'includejs2.html',
                      this.step_func(function (status) {
                assert_equals(status, 'success');
                page.includeJs(TEST_HTTP_BASE + 'includejs.js',
                               this.step_func_done(function () {
                    assert_is_true(already);
                    var title = page.evaluate('getTitle');
                    assert_equals(title, 'i am includejs two');
                }));
            }));
        }));
    }));

}, "after-inclusion callbacks should fire only once");
