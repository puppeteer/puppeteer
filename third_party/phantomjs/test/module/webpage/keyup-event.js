test(function () {
    var webpage = require('webpage');

    var page = webpage.create();

    page.evaluate(function() {
        window.addEventListener('keyup', function(event) {
            window.loggedEvent = window.loggedEvent || [];
            window.loggedEvent.push(event.which);
        }, false);
    });

    page.sendEvent('keyup', page.event.key.B);
    var loggedEvent = page.evaluate(function() {
        return window.loggedEvent;
    });

    assert_equals(loggedEvent.length, 1);
    assert_equals(loggedEvent[0], page.event.key.B);
}, "key-up events");
