var url = TEST_HTTP_BASE + "regression/webkit-60448.html";

async_test(function () {
    var p = require("webpage").create();
    p.open(url, this.step_func_done(function (status) {
        assert_equals(status, "success");
        assert_is_true(p.evaluate(function () {
            return document.getElementById("test") === null;
        }));
    }));
},
"remove an inline HTML element from the document");
