//! unsupported
var webpage = require('webpage');

test(function () {
    var page = webpage.create();
    assert_equals(page.zoomFactor, 1.0);

    page.zoomFactor = 1.5;
    assert_equals(page.zoomFactor, 1.5);

    page.zoomFactor = 2.0;
    assert_equals(page.zoomFactor, 2.0);

    page.zoomFactor = 0.5;
    assert_equals(page.zoomFactor, 0.5);
}, "page.zoomFactor");

// TODO: render using zoomFactor != 1 and check the result
