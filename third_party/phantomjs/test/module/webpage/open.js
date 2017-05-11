async_test(function () {
    var webpage = require('webpage');
    var page = webpage.create();
    assert_type_of(page, 'object');

    page.onResourceReceived = this.step_func(function (resource) {
        assert_equals(resource.status, 200);
    });
    page.open(TEST_HTTP_BASE + 'hello.html',
              this.step_func_done(function (status) {
                  assert_equals(status, 'success');
                  assert_type_of(page.title, 'string');
                  assert_equals(page.title, 'Hello');
                  assert_type_of(page.plainText, 'string');
                  assert_equals(page.plainText, 'Hello, world!');
              }));
}, "opening a webpage");

async_test(function () {
    var webpage = require('webpage');
    var page = webpage.create();

    // both onResourceReceived and onResourceError should be called
    page.onResourceReceived = this.step_func(function (resource) {
        assert_equals(resource.status, 401);
    });
    page.onResourceError = this.step_func(function (err) {
        assert_equals(err.errorString, "Operation canceled");
    });

    page.open(TEST_HTTP_BASE + 'status?status=401' +
              '&WWW-Authenticate=Basic%20realm%3D%22PhantomJS%20test%22',
              this.step_func_done(function (status) {
                  assert_equals(status, 'fail');
              }));

}, "proper handling of HTTP error responses", {/* unsupported */expected_fail: true});

async_test(function () {
    var webpage = require('webpage');
    var page = webpage.create();

    page.settings.resourceTimeout = 1;

    // This is all you have to do to assert that a hook does get called.
    page.onResourceTimeout = this.step_func(function(){});

    page.open(TEST_HTTP_BASE + "delay?5",
              this.step_func_done(function (s) {
                  assert_not_equals(s, "success");
              }));

}, "onResourceTimeout fires after resourceTimeout ms", {/* unsupported */expected_fail: true});
