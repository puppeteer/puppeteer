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

    function testFrameSwitchingDeprecated() {
        assert_equals(pageTitle(p), "index");
        assert_equals(p.currentFrameName(), "");
        assert_equals(p.childFramesCount(), 2);
        assert_deep_equals(p.childFramesName(), ["frame1", "frame2"]);
        setPageTitle(p, pageTitle(p) + "-visited");

        assert_is_true(p.switchToChildFrame("frame1"));
        assert_equals(pageTitle(p), "frame1");
        assert_equals(p.currentFrameName(), "frame1");
        assert_equals(p.childFramesCount(), 2);
        assert_deep_equals(p.childFramesName(), ["frame1-1", "frame1-2"]);
        setPageTitle(p, pageTitle(p) + "-visited");

        assert_is_true(p.switchToChildFrame("frame1-2"));
        assert_equals(pageTitle(p), "frame1-2");
        assert_equals(p.currentFrameName(), "frame1-2");
        assert_equals(p.childFramesCount(), 0);
        assert_deep_equals(p.childFramesName(), []);
        setPageTitle(p, pageTitle(p) + "-visited");

        assert_is_true(p.switchToParentFrame());
        assert_equals(pageTitle(p), "frame1-visited");
        assert_equals(p.currentFrameName(), "frame1");
        assert_equals(p.childFramesCount(), 2);
        assert_deep_equals(p.childFramesName(), ["frame1-1", "frame1-2"]);

        assert_is_true(p.switchToChildFrame(0));
        assert_equals(pageTitle(p), "frame1-1");
        assert_equals(p.currentFrameName(), "frame1-1");
        assert_equals(p.childFramesCount(), 0);
        assert_deep_equals(p.childFramesName(), []);

        assert_equals(p.switchToMainFrame(), undefined);
        assert_equals(pageTitle(p), "index-visited");
        assert_equals(p.currentFrameName(), "");
        assert_equals(p.childFramesCount(), 2);
        assert_deep_equals(p.childFramesName(), ["frame1", "frame2"]);

        assert_is_true(p.switchToChildFrame("frame2"));
        assert_equals(pageTitle(p), "frame2");
        assert_equals(p.currentFrameName(), "frame2");
        assert_equals(p.childFramesCount(), 3);
        assert_deep_equals(p.childFramesName(),
                            ["frame2-1", "frame2-2", "frame2-3"]);
    }

    p.open(TEST_HTTP_BASE + "frameset", this.step_func_done(function (s) {
        assert_equals(s, "success");
        testFrameSwitchingDeprecated();
    }));

}, "frame switching deprecated API");
