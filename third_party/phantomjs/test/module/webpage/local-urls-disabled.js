//! unsupported
//! phantomjs: --local-url-access=no

var webpage = require("webpage");

async_test(function () {
    var page = webpage.create();
    var url = "file:///nonexistent";
    var rsErrorCalled = false;

    page.onResourceError = this.step_func(function (error) {
        rsErrorCalled = true;
        assert_equals(error.url, url);
        assert_equals(error.errorCode, 301);
        assert_equals(error.errorString, 'Protocol "file" is unknown');
    });

    page.open(url, this.step_func_done(function () {
        assert_is_true(rsErrorCalled);
    }));

}, "doesn't attempt to load a file: URL with --local-url-access=no");
