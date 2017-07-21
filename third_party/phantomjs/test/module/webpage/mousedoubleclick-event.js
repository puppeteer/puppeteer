test(function () {
    var page = require('webpage').create();

    page.content = '<input id="doubleClickField" type="text" onclick="document.getElementById(\'doubleClickField\').value=\'clicked\';" ondblclick="document.getElementById(\'doubleClickField\').value=\'doubleclicked\';" oncontextmenu="document.getElementById(\'doubleClickField\').value=\'rightclicked\'; return false;" value="hello"/>';
    var point = page.evaluate(function () {
        var el = document.querySelector('input');
        var rect = el.getBoundingClientRect();
        return { x: rect.left + Math.floor(rect.width / 2), y: rect.top + (rect.height / 2) };
    });
    page.sendEvent('doubleclick', point.x, point.y);

    var text = page.evaluate(function () {
        return document.querySelector('input').value;
    });
    assert_equals(text, "doubleclicked");

    // click with modifier key
    page.evaluate(function() {
        window.addEventListener('dblclick', function(event) {
            window.loggedEvent = window.loggedEvent || {};
            window.loggedEvent.dblclick = {clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey};
        }, false);
    });
    page.sendEvent('doubleclick', 100, 100, 'left', page.event.modifier.shift);

    var event = page.evaluate(function() {
        return window.loggedEvent.dblclick;
    });
    assert_is_true(event.shiftKey);
}, "mouse double-click events");
