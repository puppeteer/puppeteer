test(function () {
    var page = require('webpage').create();

    var msg = "message",
        value = "value",
        result,
        expected = "extra-value";
    page.onPrompt = function(msg, value) {
        return "extra-"+value;
    };
    result = page.evaluate(function(m, v) {
        return window.prompt(m, v);
    }, msg, value);

    assert_equals(result, expected);
}, "page.onPrompt");
