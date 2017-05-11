async_test(function () {
    var webpage = require('webpage');
    var page = webpage.create();
    assert_type_of(page.customHeaders, 'object');
    assert_deep_equals(page.customHeaders, {});

    // NOTE: HTTP header names are case-insensitive. Our test server
    // returns the name in lowercase.
    page.customHeaders =  {
        'Custom-Key': 'Custom-Value',
        'User-Agent': 'Overriden-UA',
        'Referer': 'http://example.com/'
    };
    page.open(TEST_HTTP_BASE + 'echo', this.step_func_done(function (status) {
        var json, headers;
        assert_equals(status, 'success');
        json = JSON.parse(page.plainText);
        assert_type_of(json, 'object');
        headers = json.headers;
        assert_type_of(headers, 'object');

        assert_own_property(headers, 'custom-key');
        assert_own_property(headers, 'user-agent');
        assert_own_property(headers, 'referer');
        assert_equals(headers['custom-key'], 'Custom-Value');
        assert_equals(headers['user-agent'], 'Overriden-UA');
        assert_equals(headers['referer'], 'http://example.com/');
    }));

}, "adding custom headers with page.customHeaders");
