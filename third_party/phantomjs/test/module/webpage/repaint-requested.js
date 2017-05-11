//! unsupported
var webpage = require('webpage');

async_test(function () {
    var page = webpage.create();
    var requestCount = 0;

    page.onRepaintRequested = this.step_func(function(x, y, w, h) {
        if ((w > 0) && (h > 0)) {
            ++requestCount;
        }
    });

    page.open(TEST_HTTP_BASE + 'hello.html',
              this.step_func_done(function (status) {
                  assert_equals(status, 'success');
                  assert_greater_than(requestCount, 0);
              }));

}, "onRepaintRequested should be called at least once for each page load");
