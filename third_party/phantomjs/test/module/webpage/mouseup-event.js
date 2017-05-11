//! unsupported
test(function () {
    var webpage = require('webpage');
    var page = webpage.create();

    page.evaluate(function() {
        window.addEventListener('mouseup', function(event) {
            window.loggedEvent = window.loggedEvent || [];
            window.loggedEvent.push(event);
        }, false);
    });

    page.sendEvent('mouseup', 42, 217);
    var loggedEvent = page.evaluate(function() {
        return window.loggedEvent;
    });
    assert_equals(loggedEvent.length, 1);
    assert_equals(loggedEvent[0].clientX, 42);
    assert_equals(loggedEvent[0].clientY, 217);

    page.sendEvent('mouseup', 100, 100, 'left', page.event.modifier.shift);
    loggedEvent = page.evaluate(function() {
        return window.loggedEvent;
    });
    assert_equals(loggedEvent.length, 2);
    assert_is_true(loggedEvent[1].shiftKey);
}, "mouse-up events");
