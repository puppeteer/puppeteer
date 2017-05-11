//! unsupported
//! snakeoil
async_test(function () {
    // This loads the same page as https-bad-cert.js, but tells
    // PhantomJS to trust the snakeoil certificate
    // that the test HTTPS server uses, so it should succeed.

    var page = require('webpage').create();
    var url = TEST_HTTPS_BASE;
    page.onResourceError = this.unreached_func();
    page.open(url, this.step_func_done(function (status) {
        assert_equals(status, "success");
    }));
}, "loading an HTTPS webpage");
