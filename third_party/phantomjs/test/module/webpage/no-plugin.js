async_test(function () {
    var webpage = require('webpage');
    var page = webpage.create();

    var pluginLength = page.evaluate(function() {
        return window.navigator.plugins.length;
    });
    assert_equals(pluginLength, 0);

    page.open(TEST_HTTP_BASE + 'hello.html',
              this.step_func_done(function (status) {
        assert_equals(status, 'success');
        var pluginLength = page.evaluate(function() {
            return window.navigator.plugins.length;
        });
        assert_equals(pluginLength, 0);
    }));

}, "window.navigator.plugins is empty");
