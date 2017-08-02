test(function () {
    var page = require('webpage').create();

    var msg = "message body",
        result,
        expected = true;

    assert_equals(page.onConfirm, undefined);

    var onConfirmTrue = function(msg) {
        return true;
    };
    page.onConfirm = onConfirmTrue;
    assert_equals(page.onConfirm, onConfirmTrue);

    result = page.evaluate(function(m) {
        return window.confirm(m);
    }, msg);

    assert_equals(result, expected);

    var onConfirmFunc = function() { return !!"y"; };
    page.onConfirm = onConfirmFunc;
    assert_equals(page.onConfirm, onConfirmFunc);
    assert_not_equals(page.onConfirm, onConfirmTrue);

    page.onConfirm = null;
    // Will only allow setting to a function value, so setting it to `null` returns `undefined`
    assert_equals(page.onConfirm, undefined);
    page.onConfirm = undefined;
    assert_equals(page.onConfirm, undefined);

}, "page.onConfirm");
