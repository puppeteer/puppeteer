// A SyntaxError leaks to phantom.onError, despite the try-catch.
setup({ allow_uncaught_exception: true });

test(function () {
    var helperFile = "../fixtures/parse-error-helper.js";
    try {
        phantom.injectJs(helperFile);
        assert_is_true(false);
    } catch (e) {
        assert_is_true(e.stack.indexOf('fixtures/parse-error-helper.js:2') !== -1);
    }
}, "stack trace from syntax error in injected file");
