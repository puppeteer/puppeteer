async_test(function () {
    // This loads the same page as https-good-cert.js, but does not
    // tell PhantomJS to trust the snakeoil certificate that the test
    // HTTPS server uses, so it should fail.

    var page = require('webpage').create();
    var url = TEST_HTTPS_BASE;
    page.onResourceError = this.step_func(function (err) {
        assert_equals(err.url, url);
        assert_equals(err.errorString, "SSL handshake failed");
    });
    page.open(url, this.step_func_done(function (status) {
        assert_not_equals(status, "success");
    }));
}, "should fail to load an HTTPS webpage with a self-signed certificate");
