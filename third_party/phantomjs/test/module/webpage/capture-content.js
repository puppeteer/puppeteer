//! unsupported
var content;
setup(function () {
    var fs = require('fs');
    // libraryPath is test/module/webpage
    content = fs.read(fs.join(phantom.libraryPath,
                              "../../www/hello.html"));
});

// XFAIL: This feature had to be backed out for breaking WebSockets.
async_test(function () {
    var page = require('webpage').create();
    var lastChunk = "";
    var bodySize = 0;
    page.captureContent = ['.*'];
    // Not a step function because it may be called several times
    // and doesn't need to make assertions.
    page.onResourceReceived = function (resource) {
        lastChunk = resource.body;
        bodySize = resource.bodySize;
    };
    page.open(TEST_HTTP_BASE + "hello.html",
              this.step_func_done(function (status) {
                  assert_equals(status, "success");
                  assert_equals(bodySize, content.length);
                  assert_equals(lastChunk, content);
              }));

}, "onResourceReceived sees the body if captureContent is activated",
   { expected_fail: true }
);

async_test(function () {
    var page = require('webpage').create();
    var lastChunk = "";
    var bodySize = 0;
    page.captureContent = ['/some/other/url'];
    // Not a step function because it may be called several times
    // and doesn't need to make assertions.
    page.onResourceReceived = function (resource) {
        lastChunk = resource.body;
        bodySize = resource.bodySize;
    };
    page.open(TEST_HTTP_BASE + "hello.html",
              this.step_func_done(function (status) {
                  assert_equals(status, "success");
                  assert_equals(bodySize, 0);
                  assert_equals(lastChunk, "");
              }));
}, "onResourceReceived doesn't see the body if captureContent doesn't match");
