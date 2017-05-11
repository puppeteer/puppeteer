//! unsupported
async_test(function () {
    var url = TEST_HTTP_BASE + "echo";
    var page = new WebPage();

    page.cookies = [{
        'name' : 'Valid-Cookie-Name',
        'value' : 'Valid-Cookie-Value',
        'domain' : 'localhost',
        'path' : '/',
        'httponly' : true,
        'secure' : false
    },{
        'name' : 'Valid-Cookie-Name-Sec',
        'value' : 'Valid-Cookie-Value-Sec',
        'domain' : 'localhost',
        'path' : '/',
        'httponly' : true,
        'secure' : false,
        'expires' : Date.now() + 3600 //< expires in 1h
    }];

    page.open(url, this.step_func(function (status) {
        assert_equals(status, "success");
        var headers = JSON.parse(page.plainText).headers;
        assert_own_property(headers, 'cookie');
        assert_regexp_match(headers.cookie, /\bValid-Cookie-Name\b/);
        assert_regexp_match(headers.cookie, /\bValid-Cookie-Value\b/);
        assert_regexp_match(headers.cookie, /\bValid-Cookie-Name-Sec\b/);
        assert_regexp_match(headers.cookie, /\bValid-Cookie-Value-Sec\b/);
        assert_not_equals(page.cookies.length, 0);

        page.cookies = [];
        page.open(url, this.step_func_done(function (status) {
            assert_equals(status, "success");
            var headers = JSON.parse(page.plainText).headers;
            assert_no_property(headers, 'cookie');
        }));
    }));
}, "adding and deleting cookies with page.cookies");

async_test(function () {
    var url = TEST_HTTP_BASE + "echo";
    var page = new WebPage();

    page.addCookie({
        'name' : 'Added-Cookie-Name',
        'value' : 'Added-Cookie-Value',
        'domain' : 'localhost'
    });

    page.open(url, this.step_func(function (status) {
        assert_equals(status, "success");
        var headers = JSON.parse(page.plainText).headers;
        assert_own_property(headers, 'cookie');
        assert_regexp_match(headers.cookie, /\bAdded-Cookie-Name\b/);
        assert_regexp_match(headers.cookie, /\bAdded-Cookie-Value\b/);

        page.deleteCookie("Added-Cookie-Name");
        page.open(url, this.step_func_done(function (status) {
            assert_equals(status, "success");
            var headers = JSON.parse(page.plainText).headers;
            assert_no_property(headers, 'cookie');
        }));
    }));

}, "adding and deleting cookies with page.addCookie and page.deleteCookie");

async_test(function () {
    var url = TEST_HTTP_BASE + "echo";
    var page = new WebPage();

    page.cookies = [
        { // domain mismatch.
            'name' : 'Invalid-Cookie-Name-1',
            'value' : 'Invalid-Cookie-Value-1',
            'domain' : 'foo.example'
        },{ // path mismatch: the cookie will be set,
            // but won't be visible from the given URL (not same path).
            'name' : 'Invalid-Cookie-Name-2',
            'value' : 'Invalid-Cookie-Value-2',
            'domain' : 'localhost',
            'path' : '/bar'
        },{ // cookie expired.
            'name' : 'Invalid-Cookie-Name-3',
            'value' : 'Invalid-Cookie-Value-3',
            'domain' : 'localhost',
            'expires' : 'Sat, 01 Jan 2000 00:00:00 GMT'
        },{ // https only: the cookie will be set,
            // but won't be visible from the given URL (not https).
            'name' : 'Invalid-Cookie-Name-4',
            'value' : 'Invalid-Cookie-Value-4',
            'domain' : 'localhost',
            'secure' : true
        },{ // cookie expired (date in "sec since epoch").
            'name' : 'Invalid-Cookie-Name-5',
            'value' : 'Invalid-Cookie-Value-5',
            'domain' : 'localhost',
            'expires' : new Date().getTime() - 1 //< date in the past
        },{ // cookie expired (date in "sec since epoch" - using "expiry").
            'name' : 'Invalid-Cookie-Name-6',
            'value' : 'Invalid-Cookie-Value-6',
            'domain' : 'localhost',
            'expiry' : new Date().getTime() - 1 //< date in the past
        }];

    page.open(url, this.step_func_done(function (status) {
        assert_equals(status, "success");
        var headers = JSON.parse(page.plainText).headers;
        assert_no_property(headers, 'cookie');
    }));
}, "page.cookies provides cookies only to appropriate requests");
