test(function () {
    var page = require('webpage').create();

    page.evaluate(function() {
        window.addEventListener('contextmenu', function(event) {
            window.loggedEvent = window.loggedEvent || {};
            window.loggedEvent.contextmenu = {clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey};
        }, false);
    });
    page.sendEvent('contextmenu', 42, 217);

    var event = page.evaluate(function() {
        return window.loggedEvent;
    });
    assert_equals(event.contextmenu.clientX, 42);
    assert_equals(event.contextmenu.clientY, 217);

    // click with modifier key
    page.evaluate(function() {
        window.addEventListener('contextmenu', function(event) {
            window.loggedEvent = window.loggedEvent || {};
            window.loggedEvent.contextmenu = {clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey};
        }, false);
    });
    page.sendEvent('contextmenu', 100, 100, 'left', page.event.modifier.shift);

    var event = page.evaluate(function() {
        return window.loggedEvent.contextmenu;
    });
    assert_is_true(event.shiftKey);

}, "context click events");
