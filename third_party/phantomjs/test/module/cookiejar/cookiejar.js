//! unsupported
var cookie0 = {
    'name':     'Valid-Cookie-Name',
    'value':    'Valid-Cookie-Value',
    'domain':   'localhost',
    'path':     '/foo',
    'httponly': true,
    'secure':   false
};
var cookie1 = {
    'name':     'Valid-Cookie-Name-1',
    'value':    'Valid-Cookie-Value',
    'domain':   'localhost',
    'path':     '/foo',
    'httponly': true,
    'secure':   false
};
var cookie2 = {
    'name':     'Valid-Cookie-Name-2',
    'value':    'Valid-Cookie-Value',
    'domain':   'localhost',
    'path':     '/foo',
    'httponly': true,
    'secure':   false
};
var cookies = [{
    'name':     'Valid-Cookie-Name',
    'value':    'Valid-Cookie-Value',
    'domain':   'localhost',
    'path':     '/foo',
    'httponly': true,
    'secure':   false
},{
    'name':     'Valid-Cookie-Name-Sec',
    'value':    'Valid-Cookie-Value-Sec',
    'domain':   'localhost',
    'path':     '/foo',
    'httponly': true,
    'secure':   false,
    'expires':  new Date().getTime() + 3600 //< expires in 1h
}];

var cookiejar, jar1, jar2;
setup(function () {
    cookiejar = require('cookiejar');
    jar1 = cookiejar.create();
    jar2 = cookiejar.create();
});

test(function () {
    assert_type_of(jar1, 'object');
    assert_not_equals(jar1, null);
    assert_type_of(jar1.cookies, 'object');

    assert_type_of(jar1.addCookie, 'function');
    assert_type_of(jar1.deleteCookie, 'function');
    assert_type_of(jar1.clearCookies, 'function');
}, "cookie jar properties");

test(function () {
    assert_equals(jar1.cookies.length, 0);

    jar1.addCookie(cookie0);
    assert_equals(jar1.cookies.length, 1);

    jar1.deleteCookie('Valid-Cookie-Name');
    assert_equals(jar1.cookies.length, 0);
}, "adding and removing cookies");

test(function () {
    assert_equals(jar1.cookies.length, 0);

    jar1.cookies = cookies;
    assert_equals(jar1.cookies.length, 2);

    jar1.clearCookies();
    assert_equals(jar1.cookies.length, 0);
}, "setting and clearing a cookie jar");

test(function () {
    jar1.addCookie(cookie1);
    assert_equals(jar1.cookies.length, 1);
    assert_equals(jar2.cookies.length, 0);

    jar2.addCookie(cookie2);
    jar1.deleteCookie('Valid-Cookie-Name-1');
    assert_equals(jar1.cookies.length, 0);
    assert_equals(jar2.cookies.length, 1);

    jar1.close();
    jar2.close();

}, "cookie jar isolation");
