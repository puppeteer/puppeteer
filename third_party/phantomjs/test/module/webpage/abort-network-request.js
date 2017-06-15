var webpage = require('webpage');

async_test(function () {
    var page = webpage.create();
    var abortCount = 0;
    var errorCount = 0;
    var abortedIds = {};
    var urlToBlockRegExp = /logo\.png$/i;

    page.onResourceRequested = this.step_func(function(requestData, request) {
        assert_type_of(request, 'object');
        assert_type_of(request.abort, 'function');
        if (urlToBlockRegExp.test(requestData.url)) {
            request.abort();
            ++abortCount;
            abortedIds[requestData.id] = 1;
        }
    });
    page.onResourceError = this.step_func(function(error) {
        // We can't match up errors to requests by URL because error.url will
        // be the empty string in this case.  FIXME.
        assert_own_property(abortedIds, error.id);
        ++errorCount;
    });
    page.onResourceReceived = this.step_func(function(response) {
        assert_regexp_not_match(response.url, urlToBlockRegExp);
    });

    page.open(TEST_HTTP_BASE + 'logo.html',
              this.step_func_done(function (status) {
                  assert_equals(status, 'success');
                  assert_equals(abortCount, 1);
                  assert_equals(errorCount, 1);
              }));

}, "can abort network requests");
