test(function () {
    var page = require('webpage').create();

    page.evaluate(function() {
        window.addEventListener('mousemove', function(event) {
            window.loggedEvent = window.loggedEvent || [];
            window.loggedEvent.push({clientX: event.clientX, clientY: event.clientY});
        }, false);
    });

    page.sendEvent('mousemove', 14, 3);
    var loggedEvent = page.evaluate(function() {
        return window.loggedEvent;
    });
    assert_equals(loggedEvent.length, 1);
    assert_equals(loggedEvent[0].clientX, 14);
    assert_equals(loggedEvent[0].clientY, 3);
}, "mouse-move events");
