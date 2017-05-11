var webpage = require('webpage');

test(function () {
    var defaultPage = webpage.create();
    assert_deep_equals(defaultPage.viewportSize, {height:300,width:400});
}, "default viewport size");

test(function () {
    var options = {
        viewportSize: {
            height: 100,
            width: 200
        }
    };
    var customPage = webpage.create(options);
    assert_deep_equals(customPage.viewportSize, options.viewportSize);
}, "custom viewport size");
