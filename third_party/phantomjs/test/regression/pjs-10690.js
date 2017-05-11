// Issue 10690: the second page load used to crash on OSX.

var url = TEST_HTTP_BASE + 'regression/pjs-10690/index.html';
function do_test() {
    var page = require('webpage').create();

    page.open(url, this.step_func_done (function (status) {
        assert_equals(status, "success");
        page.release();
    }));
}

async_test(do_test, "load a page with a downloadable font, once");
async_test(do_test, "load a page with a downloadable font, again");
