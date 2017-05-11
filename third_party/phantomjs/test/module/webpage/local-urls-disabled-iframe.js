//! unsupported
//! phantomjs: --web-security=no --local-url-access=no

var webpage = require("webpage");

async_test(function () {
    var page = webpage.create();
    var url = TEST_HTTP_BASE + "iframe.html#file:///nonexistent";
    var rsErrorCalled = false;

    page.onResourceError = this.step_func(function (error) {
        rsErrorCalled = true;
        assert_equals(error.url, "file:///nonexistent");
        assert_equals(error.errorCode, 301);
        assert_equals(error.errorString, 'Protocol "file" is unknown');
    });

    page.open(url, this.step_func_done(function () {
        assert_is_true(rsErrorCalled);
    }));

},
"doesn't attempt to load a file: URL in an iframe with --local-url-access=no");
