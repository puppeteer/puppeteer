test(function () {
    var page = require('webpage').create();

    page.evaluate(function() {
        window.addEventListener('mousedown', function(event) {
            window.loggedEvent = window.loggedEvent || {};
            window.loggedEvent.mousedown = {clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey};
        }, false);
        window.addEventListener('mouseup', function(event) {
            window.loggedEvent = window.loggedEvent || {};
            window.loggedEvent.mouseup = {clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey};
        }, false);
    });
    page.sendEvent('click', 42, 217);

    var event = page.evaluate(function() {
        return window.loggedEvent;
    });
    assert_equals(event.mouseup.clientX, 42);
    assert_equals(event.mouseup.clientY, 217);
    assert_equals(event.mousedown.clientX, 42);
    assert_equals(event.mousedown.clientY, 217);

    // click with modifier key
    page.evaluate(function() {
        window.addEventListener('click', function(event) {
            window.loggedEvent = window.loggedEvent || {};
            window.loggedEvent.click = {clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey};
        }, false);
    });
    page.sendEvent('click', 100, 100, 'left', page.event.modifier.shift);

    var event = page.evaluate(function() {
        return window.loggedEvent.click;
    });
    assert_is_true(event.shiftKey);

}, "mouse click events");
