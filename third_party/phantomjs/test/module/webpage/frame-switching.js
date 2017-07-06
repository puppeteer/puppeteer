async_test(function () {
    var p = require("webpage").create();

    function pageTitle(page) {
        return page.evaluate(function(){
            return window.document.title;
        });
    }

    function setPageTitle(page, newTitle) {
        page.evaluate(function(newTitle){
            window.document.title = newTitle;
        }, newTitle);
    }

    function testFrameSwitching() {
        assert_equals(pageTitle(p), "index");
        assert_equals(p.frameName, "");
        assert_equals(p.framesCount, 2);
        assert_deep_equals(p.framesName, ["frame1", "frame2"]);
        setPageTitle(p, pageTitle(p) + "-visited");

        assert_is_true(p.switchToFrame("frame1"));
        assert_equals(pageTitle(p), "frame1");
        assert_equals(p.frameName, "frame1");
        assert_equals(p.framesCount, 2);
        assert_deep_equals(p.framesName, ["frame1-1", "frame1-2"]);
        setPageTitle(p, pageTitle(p) + "-visited");

        assert_is_true(p.switchToFrame("frame1-2"));
        assert_equals(pageTitle(p), "frame1-2");
        assert_equals(p.frameName, "frame1-2");
        assert_equals(p.framesCount, 0);
        assert_deep_equals(p.framesName, []);
        setPageTitle(p, pageTitle(p) + "-visited");

        assert_is_true(p.switchToParentFrame());
        assert_equals(pageTitle(p), "frame1-visited");
        assert_equals(p.frameName, "frame1");
        assert_equals(p.framesCount, 2);
        assert_deep_equals(p.framesName, ["frame1-1", "frame1-2"]);

        assert_is_true(p.switchToFrame(0));
        assert_equals(pageTitle(p), "frame1-1");
        assert_equals(p.frameName, "frame1-1");
        assert_equals(p.framesCount, 0);
        assert_deep_equals(p.framesName, []);

        assert_equals(p.switchToMainFrame(), undefined);
        assert_equals(pageTitle(p), "index-visited");
        assert_equals(p.frameName, "");
        assert_equals(p.framesCount, 2);
        assert_deep_equals(p.framesName, ["frame1", "frame2"]);

        assert_is_true(p.switchToFrame("frame2"));
        assert_equals(pageTitle(p), "frame2");
        assert_equals(p.frameName, "frame2");
        assert_equals(p.framesCount, 3);
        assert_deep_equals(p.framesName,
                            ["frame2-1", "frame2-2", "frame2-3"]);

        assert_equals(p.focusedFrameName, "");

        p.evaluate(function(){
            window.focus();
        });
        assert_equals(p.focusedFrameName, "frame2");

        assert_is_true(p.switchToFrame("frame2-1"));
        p.evaluate(function(){
            window.focus();
        });
        assert_equals(p.focusedFrameName, "frame2-1");

        assert_equals(p.switchToMainFrame(), undefined);
        p.evaluate(function(){
            window.focus();
        });
        assert_equals(p.focusedFrameName, "");

        p.evaluate(function(){
            window.frames[0].focus();
        });
        assert_equals(p.focusedFrameName, "frame1");
        assert_equals(p.frameName, "");

        assert_equals(p.switchToFocusedFrame(), undefined);
        assert_equals(p.frameName, "frame1");
    }

    p.open(TEST_HTTP_BASE + "frameset",
           this.step_func_done(function (s) {
        assert_equals(s, "success");
        testFrameSwitching();
    }));

}, "frame switching API");
