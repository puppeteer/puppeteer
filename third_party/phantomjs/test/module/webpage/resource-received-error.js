//! unsupported
var webpage = require('webpage');

async_test(function () {
    var page = webpage.create();
    var url = TEST_HTTP_BASE + 'status?400';
    var startStage = 0;
    var endStage = 0;
    var errors = 0;

    page.onResourceReceived = this.step_func(function (resource) {
        assert_equals(resource.url, url);
        if (resource.stage === 'start') {
            ++startStage;
        }
        if (resource.stage === 'end') {
            ++endStage;
        }
    });
    page.onResourceError = this.step_func(function (error) {
        assert_equals(error.url, url);
        assert_equals(error.status, 400);
        ++errors;
    });

    page.open(url, this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(startStage, 1);
        assert_equals(endStage, 1);
        assert_equals(errors, 1);
    }));

}, "onResourceReceived should still be called for failed requests");
