//! unsupported
// Issue #13551: Crash when switching "back" from frame that no longer
// exists (for whatever reason)

var webpage = require('webpage');

function test_template(parent, action) {
    var page;
    var url = TEST_HTTP_BASE +
              "/regression/pjs-13551/" + parent + "-parent.html";
    var s_callback0, s_callback1, s_callback2;

    function callback0 (n) {
        assert_equals(n, 0);
        page.onCallback = s_callback1;
        page.evaluate(function () {
            document.getElementById("prepare").click();
        });
    }
    function callback1 (n) {
        assert_equals(n, 1);
        page.onCallback = s_callback2;
        assert_equals(page.switchToFrame("target"), true);
        assert_equals(page.switchToFrame("actor"), true);
        page.evaluate(function () {
            document.getElementById("execute").click();
        });
    }
    function callback2 (n) {
        assert_equals(n, 2);
        assert_is_true(action == 'main' || action == 'parent');
        if (action == 'main') {
            page.switchToMainFrame(); // Crash here
        } else {
            page.switchToParentFrame(); // Or here
        }
    }

    return function test_action () {
        page = webpage.create();
        s_callback0 = this.step_func(callback0);
        s_callback1 = this.step_func(callback1);
        s_callback2 = this.step_func_done(callback2);
        page.onCallback = s_callback0;
        page.open(url);
    };
}

async_test(test_template('closing',   'main'),   "main from closed");
async_test(test_template('closing',   'parent'), "parent from closed");
async_test(test_template('reloading', 'main'),   "main from reloaded");
async_test(test_template('reloading', 'parent'), "parent from reloaded");
