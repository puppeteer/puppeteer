var webpage = require('webpage');

// NOTE: HTTP header names are case-insensitive. Our test server
// returns the name in lowercase.
async_test(function () {
    var page = webpage.create();
    assert_type_of(page.customHeaders, 'object');
    assert_deep_equals(page.customHeaders, {});

    page.customHeaders = { 'CustomHeader': 'ModifiedCustomValue' };

    page.onResourceRequested = this.step_func(function(requestData, request) {
        assert_type_of(request.setHeader, 'function');
        request.setHeader('CustomHeader', null);
    });

    page.open(TEST_HTTP_BASE + 'echo',
              this.step_func_done(function (status) {
                  var json, headers;
                  assert_equals(status, 'success');
                  json = JSON.parse(page.plainText);
                  headers = json.headers;
                  assert_no_property(headers, 'customheader');
                  assert_no_property(headers, 'CustomHeader');
              }));
});
