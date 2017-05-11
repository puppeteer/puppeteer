test(function () {
    var page = require('webpage').create();

    var msgA = "a",
        msgB = "b",
        result,
        expected = msgA + msgB;
    page.onCallback = function(a, b) {
        return a + b;
    };
    result = page.evaluate(function(a, b) {
        return window.callPhantom(a, b);
    }, msgA, msgB);

    assert_equals(result, expected);
}, "page.onCallback");
