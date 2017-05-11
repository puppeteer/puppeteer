test(function () {
    assert_own_property(window, 'WebPage');
    assert_type_of(window.WebPage, 'function');
}, "window.WebPage global property");
