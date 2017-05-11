//! unsupported
async_test(function () {
    var test = this;
    var top = require('webpage').create();
    var pages_created = 0;
    var expect_to_close = null;
    var after_close = null;

    top.onPageCreated = function (page) {
        pages_created++;
        page.onClosing = test.step_func(function (page) {
            assert_equals(page.windowName, expect_to_close);
            setTimeout(after_close, 0);
        });
        if (pages_created === 3) {
            setTimeout(after_open_3, 0);
        }
    };

    var after_open_3 = test.step_func(function () {
        assert_equals(top.pages.length, 3);
        assert_deep_equals(top.pagesWindowName, ["A", "B", "C"]);

        after_close = after_close_1;
        expect_to_close = "A";
        top.evaluate(function () { window.wA.close(); });
    });

    var after_close_1 = test.step_func(function () {
        assert_equals(top.pages.length, 2);
        assert_deep_equals(top.pagesWindowName, ["B", "C"]);


        var pageB = top.getPage("B");
        assert_not_equals(pageB, null);

        after_close = after_close_2;
        expect_to_close = "B";
        pageB.close();
    });

    var after_close_2 = test.step_func(function () {
        assert_equals(top.pages.length, 1);
        assert_deep_equals(top.pagesWindowName, ["C"]);

        // Must close C as well, because its onclosing hook is a step
        // function that hasn't run yet.
        after_close = test.step_func_done();
        expect_to_close = "C";
        top.close();
    });

    top.evaluate(function () {
        var w = window;
        w.wA = w.open("data:text/html,%3Ctitle%3Epage%20A%3C/title%3E", "A");
        w.wB = w.open("data:text/html,%3Ctitle%3Epage%20B%3C/title%3E", "B");
        w.wC = w.open("data:text/html,%3Ctitle%3Epage%20C%3C/title%3E", "C");
    });

}, "pages and pagesWindowName arrays; onPageCreated and onClosing hooks");

async_test(function () {
    var test = this;
    var pages_opened = 1, pages_closed = 0;
    var top = require("webpage").create();

    var onPageCreated = test.step_func(function onPageCreated(page) {
        pages_opened++;
        page.onPageCreated = onPageCreated;
        page.onClosing = onClosing;
        if (pages_opened === 4) {
            setTimeout(after_open_4, 0);
        }
    });
    var onClosing = test.step_func(function onClosing(page) {
        pages_closed++;
        if (pages_opened === pages_closed) {
            test.done();
        }
    });

    // This can't be inlined into onPageCreated because
    // pagesWindowName is not quite up-to-date when that hook fires.
    var after_open_4 = test.step_func(function () {
        assert_equals(top.pages.length, 3);
        assert_deep_equals(top.pagesWindowName, ["A", "B", "C"]);
        top.close();
    });

    top.onPageCreated = onPageCreated;
    top.onClosing = onClosing;

    top.evaluate(function () {
        var w = window;
        w.wA = w.open("data:text/html,%3Ctitle%3Epage%20A%3C/title%3E", "A");
        w.wB = w.open("data:text/html,%3Ctitle%3Epage%20B%3C/title%3E", "B");
        w.wC = w.open("data:text/html,%3Ctitle%3Epage%20C%3C/title%3E", "C");
    });

}, "close subwindows when parent page is closed (default behavior)");

async_test(function () {
    var test = this;
    var pages_opened = 1;
    var top = require("webpage").create();
    top.ownsPages = false;

    var onPageCreated = test.step_func(function onPageCreated(page) {
        pages_opened++;
        page.onPageCreated = onPageCreated;
        page.onClosing = test.unreached_func();
        if (pages_opened === 4) {
            assert_equals(top.pages.length, 0);
            assert_deep_equals(top.pagesWindowName, []);
            top.close();
        }
    });
    top.onPageCreated = onPageCreated;

    top.onClosing = test.step_func(function onTopClosing(page) {
        setTimeout(function () { test.done(); }, 50);
    });

    top.evaluate(function () {
        var w = window;
        w.wA = w.open("data:text/html,%3Ctitle%3Epage%20A%3C/title%3E", "A");
        w.wB = w.open("data:text/html,%3Ctitle%3Epage%20B%3C/title%3E", "B");
        w.wC = w.open("data:text/html,%3Ctitle%3Epage%20C%3C/title%3E", "C");
    });
}, "don't close subwindows when parent page is closed (ownsPages=false)");
