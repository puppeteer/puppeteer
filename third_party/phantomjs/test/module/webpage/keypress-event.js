//! unsupported
test(function () {
    var webpage = require('webpage');

    var page = webpage.create();

    page.evaluate(function() {
        window.addEventListener('keypress', function(event) {
            window.loggedEvent = window.loggedEvent || [];
            window.loggedEvent.push(event);
        }, false);
    });

    page.sendEvent('keypress', page.event.key.C);
    var loggedEvent = page.evaluate(function() {
        return window.loggedEvent;
    });

    assert_equals(loggedEvent.length, 1);
    assert_equals(loggedEvent[0].which, page.event.key.C);


    // Send keypress events to an input element and observe the effect.

    page.content = '<input type="text">';
    page.evaluate(function() {
        document.querySelector('input').focus();
    });

    function getText() {
        return page.evaluate(function() {
            return document.querySelector('input').value;
        });
    }

    page.sendEvent('keypress', page.event.key.A);
    assert_equals(getText(), 'A');
    page.sendEvent('keypress', page.event.key.B);
    assert_equals(getText(), 'AB');
    page.sendEvent('keypress', page.event.key.Backspace);
    assert_equals(getText(), 'A');
    page.sendEvent('keypress', page.event.key.Backspace);
    assert_equals(getText(), '');

    page.sendEvent('keypress', 'XYZ');
    assert_equals(getText(), 'XYZ');

    // Special character: A with umlaut
    page.sendEvent('keypress', 'ä');
    assert_equals(getText(), 'XYZä');

    // 0x02000000 is the Shift modifier.
    page.sendEvent('keypress', page.event.key.Home, null, null,  0x02000000);
    page.sendEvent('keypress', page.event.key.Delete);
    assert_equals(getText(), '');

    // Cut and Paste
    // 0x04000000 is the Control modifier.
    page.sendEvent('keypress', 'ABCD');
    assert_equals(getText(), 'ABCD');
    page.sendEvent('keypress', page.event.key.Home, null, null,  0x02000000);
    page.sendEvent('keypress', 'x', null, null, 0x04000000);
    assert_equals(getText(), '');
    page.sendEvent('keypress', 'v', null, null, 0x04000000);
    assert_equals(getText(), 'ABCD');
}, "key press events");
