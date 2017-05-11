//! unsupported
test(function () {
    var opts = {},
        page = new WebPage(opts);
    assert_type_of(page, 'object');
    assert_not_equals(page, null);
}, "webpage constructor accepts an opts object");

async_test(function () {
    var opts = {
        onConsoleMessage: this.step_func_done(function (msg) {
            assert_equals(msg, "test log");
        })
    };
    var page = new WebPage(opts);
    assert_equals(page.onConsoleMessage, opts.onConsoleMessage);
    page.evaluate(function () {console.log('test log');});

}, "specifying onConsoleMessage with opts");

async_test(function () {
    var page_opened = false;
    var opts = {
        onLoadStarted: this.step_func_done(function (msg) {
            assert_is_true(page_opened);
        })
    };
    var page = new WebPage(opts);
    assert_equals(page.onLoadStarted, opts.onLoadStarted);
    page_opened = true;
    page.open("about:blank");

}, "specifying onLoadStarted with opts");

async_test(function () {
    var page_opened = false;
    var opts = {
        onLoadFinished: this.step_func_done(function (msg) {
            assert_is_true(page_opened);
        })
    };
    var page = new WebPage(opts);
    assert_equals(page.onLoadFinished, opts.onLoadFinished);
    page_opened = true;
    page.open("about:blank");

}, "specifying onLoadFinished with opts");

// FIXME: Actually test that the timeout is effective.
test(function () {
    var opts = {
        settings: {
            timeout: 100 // time in ms
        }
    };
    var page = new WebPage(opts);
    assert_equals(page.settings.timeout, opts.settings.timeout);

}, "specifying timeout with opts");
