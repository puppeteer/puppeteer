//! unsupported
/* Test the test server itself. */

var webpage = require('webpage');

function test_one_page(url) {
    var page = webpage.create();
    page.onResourceReceived = this.step_func(function (response) {
        assert_equals(response.status, 200);
    });
    page.onResourceError = this.unreached_func();
    page.onResourceTimeout = this.unreached_func();
    page.onLoadFinished = this.step_func_done(function (status) {
        assert_equals(status, 'success');
    });
    page.open(url);
}

function do_test(path) {
    var http_url  = TEST_HTTP_BASE  + path;
    var https_url = TEST_HTTPS_BASE + path;
    var http_test = async_test(http_url);
    var https_test = async_test(https_url);
    http_test.step(test_one_page, null, http_url);
    https_test.step(test_one_page, null, https_url);
}

[
    'hello.html',
    'status?200',
    'echo'
]
    .forEach(do_test);
