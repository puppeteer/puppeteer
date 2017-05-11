//! unsupported
var webpage = require('webpage');

test(function () {
    var page = webpage.create();
    var expectedContent = '<html><body><div>Test div</div></body></html>';
    var expectedLocation = 'http://www.phantomjs.org/';
    page.setContent(expectedContent, expectedLocation);

    var actualContent = page.evaluate(function() {
        return document.documentElement.textContent;
    });
    assert_equals(actualContent, 'Test div');

    var actualLocation = page.evaluate(function() {
        return window.location.href;
    });
    assert_equals(actualLocation, expectedLocation);

}, "manually set page content and location");
