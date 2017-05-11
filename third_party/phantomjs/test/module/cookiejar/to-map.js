//! unsupported
var cookies = {
    'beforeExpires': {
        'name':     'beforeExpires',
        'value':    'expireValue',
        'domain':   '.abc.com',
        'path':     '/',
        'httponly': false,
        'secure':   false,
        'expires':  'Tue, 10 Jun 2025 12:28:29 GMT'
    },
    'noExpiresDate': {
        'name':     'noExpiresDate',
        'value':    'value',
        'domain':   '.abc.com',
        'path':     '/',
        'httponly': false,
        'secure':   false,
        'expires':  null
    },
    'afterExpires': {
        'name':     'afterExpires',
        'value':    'value',
        'domain':   '.abc.com',
        'path':     '/',
        'httponly': false,
        'secure':   false,
        'expires':  'Mon, 10 Jun 2024 12:28:29 GMT'
    }
};

test(function () {
    var i, c, d, prop;
    for (i in cookies) {
        if (!cookies.hasOwnProperty(i)) continue;
        phantom.addCookie(cookies[i]);
    }
    for (i in phantom.cookies) {
        d = phantom.cookies[i];
        c = cookies[d.name];
        for (prop in c) {
            if (!c.hasOwnProperty(prop)) continue;
            if (c[prop] === null) {
                assert_no_property(d, prop);
            } else {
                assert_own_property(d, prop);
                assert_equals(c[prop], d[prop]);
            }
        }
    }

}, "optional cookie properties should not leak");
