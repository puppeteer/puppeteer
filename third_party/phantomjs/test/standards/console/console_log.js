async_test(function () {
    var page = require('webpage').create();
    page.onConsoleMessage = this.step_func_done(function (msg) {
        assert_equals(msg, "answer 42");
    });
    page.evaluate(function () {
        console.log('answer', 42);
    });
}, "console.log should support multiple arguments");
