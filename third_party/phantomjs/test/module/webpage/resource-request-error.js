//! unsupported
var webpage = require('webpage');

async_test(function () {
    var page = webpage.create();
    var resourceErrors = 0;

    page.onResourceError = this.step_func(function(err) {
        ++resourceErrors;

        assert_equals(err.status, 404);
        assert_equals(err.statusText, 'File not found');
        assert_equals(err.url, TEST_HTTP_BASE + 'notExist.png');
        assert_equals(err.errorCode, 203);
        assert_regexp_match(err.errorString,
            /Error downloading http:\/\/localhost:[0-9]+\/notExist\.png/);
        assert_regexp_match(err.errorString,
            /server replied: File not found/);
    });

    page.open(TEST_HTTP_BASE + 'missing-img.html',
              this.step_func_done(function (status) {
                  assert_equals(status, 'success');
                  assert_equals(resourceErrors, 1);
              }));

}, "resourceError basic functionality");
