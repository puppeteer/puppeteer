var webpage = require('webpage');

test(function () {
    var defaultPage = webpage.create();
    assert_deep_equals(defaultPage.clipRect, {height:0,left:0,top:0,width:0});
}, "default page.clipRect");

test(function () {
    var options = {
        clipRect: {
            height: 100,
            left: 10,
            top: 20,
            width: 200
        }
    };
    var customPage = webpage.create(options);
    assert_deep_equals(customPage.clipRect, options.clipRect);
}, "custom page.clipRect");
