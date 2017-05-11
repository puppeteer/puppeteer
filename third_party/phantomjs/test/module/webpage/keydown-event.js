//! unsupported
test(function () {
    var webpage = require('webpage');

    var page = webpage.create();

    page.evaluate(function() {
        window.addEventListener('keydown', function(event) {
            window.loggedEvent = window.loggedEvent || [];
            window.loggedEvent.push(event);
        }, false);
    });

    page.sendEvent('keydown', page.event.key.A);
    var loggedEvent = page.evaluate(function() {
        return window.loggedEvent;
    });

    assert_equals(loggedEvent.length, 1);
    assert_equals(loggedEvent[0].which, page.event.key.A);
}, "key-down events");
