//! unsupported
var webpage = require('webpage');

test(function () {
    var page = webpage.create();
    assert_not_equals(page.onError, undefined);

    var onErrorFunc1 = function() { return !"x"; };
    page.onError = onErrorFunc1;
    assert_equals(page.onError, onErrorFunc1);

    var onErrorFunc2 = function() { return !!"y"; };
    page.onError = onErrorFunc2;
    assert_equals(page.onError, onErrorFunc2);
    assert_not_equals(page.onError, onErrorFunc1);

    page.onError = null;
    // Will only allow setting to a function value, so setting it to `null` returns `undefined`
    assert_equals(page.onError, undefined);
    page.onError = undefined;
    assert_equals(page.onError, undefined);
}, "setting and clearing page.onError");

test(function () {
    var page = webpage.create();
    var lastError = null;
    page.onError = function(message) { lastError = message; };

    page.evaluate(function() { referenceError2(); });
    assert_equals(lastError, "ReferenceError: Can't find variable: referenceError2");

    page.evaluate(function() { throw "foo"; });
    assert_equals(lastError, "foo");

    page.evaluate(function() { throw Error("foo"); });
    assert_equals(lastError, "Error: foo");
}, "basic error reporting");

async_test(function () {
    var page = webpage.create();
    var lastError = null;
    page.onError = this.step_func_done(function(message) {
        assert_equals(message, "ReferenceError: Can't find variable: referenceError");
    });

    page.evaluate(function() {
        setTimeout(function() { referenceError(); }, 0);
    });

}, "error reporting from async events");

test(function () {
    var page = webpage.create();
    var hadError = false;
    page.onError = function() { hadError = true; };
    page.evaluate(function() {
        window.caughtError = false;

        try {
            referenceError();
        } catch(e) {
            window.caughtError = true;
        }
    });

    assert_equals(hadError, false);
    assert_is_true(page.evaluate(function() { return window.caughtError; }));
}, "should not report errors that were caught");

function check_stack(message, stack) {
    assert_equals(message,
                  "ReferenceError: Can't find variable: referenceError");

    if (typeof stack === "string") {
        var lines = stack.split("\n");
        assert_regexp_match(lines[0], RegExp("^bar@.*?"+helperBase+":7:23$"));
        assert_regexp_match(lines[1], RegExp("^foo@.*?"+helperBase+":3:17$"));
    } else {
        assert_regexp_match(stack[0].file, RegExp(helperBase));
        assert_equals(stack[0].line, 7);
        assert_equals(stack[0]["function"], "bar");

        assert_regexp_match(stack[1].file, RegExp(helperBase));
        assert_equals(stack[1].line, 3);
        assert_equals(stack[1]["function"], "foo");
    }
}

var helperBase = "error-helper.js";
var helperFile = "../../fixtures/" + helperBase;
assert_is_true(phantom.injectJs(helperFile));

test(function () {
    try {
        ErrorHelper.foo();
    } catch (e) {
        check_stack(e.toString(), e.stack);
    }
}, "stack trace accuracy (controller script)");

async_test(function () {
    var page = webpage.create();
    page.libraryPath = phantom.libraryPath;
    assert_is_true(page.injectJs(helperFile));

    page.onError = this.step_func_done(check_stack);
    page.evaluate(function () {
        setTimeout(function () { ErrorHelper.foo(); }, 0);
    });
}, "stack trace accuracy (webpage script)");
