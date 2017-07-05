async_test(function () {
    var page = require('webpage').create();

    page.onLongRunningScript = this.step_func_done(function () {
        page.stopJavaScript();
    });

    page.open(TEST_HTTP_BASE + "js-infinite-loop.html",
              this.step_func(function (s) {
                  assert_equals(s, "success");
              }));

}, "page.onLongRunningScript can interrupt scripts", {
    skip: true // https://github.com/ariya/phantomjs/issues/13490
               // The underlying WebKit feature is so broken that an
               // infinite loop in a _page_ script prevents timeouts
               // from firing in the _controller_!
});
