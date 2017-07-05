test(function () {
    var page = require('webpage').create();

    assert_equals(page.onInitialized, undefined);

    var onInitialized1 = function() { var x = "x"; };
    page.onInitialized = onInitialized1;
    assert_equals(page.onInitialized, onInitialized1);

    var onInitialized2 = function() { var y = "y"; };
    page.onInitialized = onInitialized2;
    assert_equals(page.onInitialized, onInitialized2);
    assert_not_equals(page.onInitialized, onInitialized1);

    page.onInitialized = null;
    // Will only allow setting to a function value, so setting it to `null` returns `undefined`
    assert_equals(page.onInitialized, undefined);

    page.onInitialized = undefined;
    assert_equals(page.onInitialized, undefined);
}, "page.onInitialized");
