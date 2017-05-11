//! unsupported
var webpage = require('webpage');

test(function () {
    var defaultPage = webpage.create();
    assert_deep_equals(defaultPage.scrollPosition, {left:0,top:0});
}, "default scroll position");

test(function () {
    var options = {
        scrollPosition: {
            left: 1,
            top: 2
        }
    };
    var customPage = webpage.create(options);
    assert_deep_equals(customPage.scrollPosition, options.scrollPosition);
}, "custom scroll position");
