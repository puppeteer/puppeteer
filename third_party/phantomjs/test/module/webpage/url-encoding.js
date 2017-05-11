//! unsupported
var webpage = require('webpage');

// Many of the URLs used in this file contain text encoded in
// Shift_JIS, so that they will not round-trip correctly if
// misinterpreted at any point as UTF-8 (and thus, the test will
// fail).  See www/url-encoding.py for Unicode equivalents.

function URL(path) {
    return TEST_HTTP_BASE + 'url-encoding?' + path;
}

async_test(function () {
    var p = webpage.create();
    p.open(URL('/'), this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(p.url, URL('/%83y%81[%83W'));
        assert_equals(p.plainText, 'PASS');
    }));

}, "page.url");

async_test(function () {
    var p = webpage.create();
    p.open(URL('/f'), this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(p.url, URL('/f'));
        assert_equals(p.framesCount, 2);

        assert_is_true(p.switchToFrame('a'));
        assert_equals(p.frameUrl, URL('/%98g'));
        assert_equals(p.framePlainText, 'PASS');

        assert_is_true(p.switchToParentFrame());
        assert_is_true(p.switchToFrame('b'));
        assert_equals(p.frameUrl, URL('/%95s%96%D1%82%C8%98_%91%88'));
        assert_equals(p.framePlainText, 'FRAME');
    }));

}, "page.frameUrl");

async_test(function () {
    var p = webpage.create();
    var n = 0;
    var expectedUrls = [ URL('/'), URL('/%83y%81[%83W') ];

    p.onNavigationRequested = this.step_func(function (url, ty, will, main) {
        assert_equals(url, expectedUrls[n]);
        assert_equals(ty, 'Other');
        assert_is_true(will);
        assert_is_true(main);
        n++;

        if (n === expectedUrls.length) {
            p.onNavigationRequested = this.unreached_func();
        }
    });
    p.open(URL('/'), this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(n, expectedUrls.length);
        assert_equals(p.plainText, 'PASS');
    }));

}, "arguments to onNavigationRequested");

async_test(function () {
    var p = webpage.create();
    var n = 0;
    var n_req = 0;
    var n_recv = 0;
    var expectedUrls = [ URL('/r'), URL('/%8F%91') ];
    var receivedUrls = {};

    p.onResourceRequested = this.step_func(function (req, nr) {
        assert_equals(req.url, expectedUrls[n_req]);
        n_req++;
        if (n_req === expectedUrls.length) {
            p.onResourceRequested = this.unreached_func();
        }
    });

    p.onResourceReceived = this.step_func(function (resp) {
        // This function may be called more than once per URL.
        if (receivedUrls.hasOwnProperty(resp.url))
            return;
        receivedUrls[resp.url] = true;
        assert_equals(resp.url, expectedUrls[n_recv]);
        n_recv++;
    });

    p.open(URL('/r'), this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(n_req, expectedUrls.length);
        assert_equals(n_recv, expectedUrls.length);
        assert_equals(p.plainText, 'PASS');
    }));

}, "arguments to onResourceRequested and onResourceReceived");

async_test(function () {
    var p = webpage.create();
    p.settings.resourceTimeout = 100;

    var n_timeout = 0;
    var n_error = 0;
    var expectedUrls_timeout = [ URL('/%89i%8Bv') ];
    // the error hook is called for timeouts as well
    var expectedUrls_error = [ URL('/%8C%CC%8F%E1'), URL('/%89i%8Bv') ];

    p.onResourceTimeout = this.step_func(function (req) {
        assert_equals(req.url, expectedUrls_timeout[n_timeout]);
        n_timeout++;

        if (n_timeout === expectedUrls_timeout.length) {
            p.onResourceTimeout = this.unreached_func();
        }
    });

    p.onResourceError = this.step_func(function (err) {
        assert_equals(err.url, expectedUrls_error[n_error]);
        n_error++;

        if (n_error === expectedUrls_error.length) {
            p.onResourceTimeout = this.unreached_func();
        }
    });

    p.open(URL("/re"), this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(n_timeout, expectedUrls_timeout.length);
        assert_equals(n_error, expectedUrls_error.length);
    }));

}, " arguments to onResourceError and onResourceTimeout");
