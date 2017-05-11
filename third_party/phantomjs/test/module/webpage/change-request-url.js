//! unsupported
var webpage = require('webpage');

async_test(function () {

    var page = webpage.create();
    var urlToChange = TEST_HTTP_BASE + 'logo.png';
    var alternativeUrl = TEST_HTTP_BASE + 'phantomjs-logo.gif';
    var startStage = 0;
    var endStage = 0;

    page.onResourceRequested = this.step_func(function(requestData, request) {
        if (requestData.url === urlToChange) {
            assert_type_of(request, 'object');
            assert_type_of(request.changeUrl, 'function');
            request.changeUrl(alternativeUrl);
        }
    });

    page.onResourceReceived = this.step_func(function(data) {
        if (data.url === alternativeUrl && data.stage === 'start') {
            ++startStage;
        }
        if (data.url === alternativeUrl && data.stage === 'end') {
            ++endStage;
        }
    });

    page.open(TEST_HTTP_BASE + 'logo.html',
              this.step_func_done(function (status) {
                  assert_equals(status, 'success');
                  assert_equals(startStage, 1);
                  assert_equals(endStage, 1);

                  // The page HTML should still refer to the original image.
                  assert_regexp_match(page.content, /logo\.png/);
                  assert_regexp_not_match(page.content, /logo\.gif/);
              }));

}, "request.changeUrl");
