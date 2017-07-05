async_test(function () {
    var webpage = require('webpage');
    var page = webpage.create();

    assert_type_of(page, 'object');
    assert_type_of(page.loading, 'boolean');
    assert_type_of(page.loadingProgress, 'number');

    assert_is_false(page.loading);
    assert_equals(page.loadingProgress, 0);

    page.open(TEST_HTTP_BASE + 'hello.html',
              this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(page.loading, false);
        assert_equals(page.loadingProgress, 100);
    }));

    assert_is_true(page.loading);
    assert_greater_than(page.loadingProgress, 0);
}, "page loading progress");
