var server, port, request_cb;
setup(function () {
    server = require("webserver").create();

    // Should be unable to listen on port 1 (FIXME: this might succeed if
    // the test suite is being run with root privileges).
    assert_is_false(server.listen(1, function () {}));
    assert_equals(server.port, "");

    // Find an unused port in the 1024--32767 range on which to run the
    // rest of the tests.  The function in "request_cb" will be called
    // for each request; it is set appropriately by each test case.
    for (var i = 1024; i < 32768; i++) {
        if (server.listen(i, function(rq,rs){return request_cb(rq,rs);})) {
            assert_equals(server.port, i.toString());
            port = server.port;
            return;
        }
    }
    assert_unreached("unable to find a free TCP port for server tests");
},
      { "test_timeout": 1000 });

function arm_check_request (test, expected_postdata, expected_bindata,
                            expected_mimetype) {
    request_cb = test.step_func(function check_request (request, response) {
        try {
            assert_type_of(request, "object");
            assert_own_property(request, "url");
            assert_own_property(request, "method");
            assert_own_property(request, "httpVersion");
            assert_own_property(request, "headers");
            assert_type_of(request.headers, "object");

            assert_type_of(response, "object");
            assert_own_property(response, "statusCode");
            assert_own_property(response, "headers");
            assert_type_of(response.setHeaders, "function");
            assert_type_of(response.setHeader, "function");
            assert_type_of(response.header, "function");
            assert_type_of(response.write, "function");
            assert_type_of(response.writeHead, "function");

            if (expected_postdata !== false) {
                assert_equals(request.method, "POST");
                assert_own_property(request, "post");
                if (request.headers["Content-Type"] ===
                    "application/x-www-form-urlencoded") {
                    assert_own_property(request, "postRaw");
                    assert_type_of(request.postRaw, "string");
                    assert_type_of(request.post, "object");
                    assert_deep_equals(request.post, expected_postdata);
                } else {
                    assert_no_property(request, "postRaw");
                    assert_type_of(request.post, "string");
                    assert_not_equals(request.post, expected_postdata);
                }
            }

            response.setHeader("X-Request-URL", request.url);

            if (expected_bindata !== false) {
                response.setEncoding("binary");
                response.setHeader("Content-Type", expected_mimetype);
                response.write(expected_bindata);
            } else {
                response.write("request handled");
            }
        } finally {
            response.close();
            request_cb = test.unreached_func();
        }
    });
}

async_test(function () {
    var page = require("webpage").create();
    var url = "http://localhost:"+port+"/foo/bar.php?asdf=true";

    arm_check_request(this, false, false);
    page.open(url, this.step_func_done(function (status) {
        assert_equals(status, "success");
        assert_equals(page.plainText, "request handled");
    }));

}, "basic request handling");

async_test(function () {
    var page = require("webpage").create();
    var url = "http://localhost:"+port+"/%95s%96%D1%82%C8%98_%91%88";
    var already = false;

    arm_check_request(this, false, false);
    page.onResourceReceived = this.step_func(function (resp) {
        if (already) return;
        already = true;

        var found = false;
        resp.headers.forEach(function (hdr) {
            if (hdr.name.toLowerCase() === "x-request-url") {
                assert_equals(hdr.value, "/%95s%96%D1%82%C8%98_%91%88");
                found = true;
            }
        });
        assert_is_true(found);
    });

    page.open(url, this.step_func_done(function (status) {
        assert_equals(status, "success");
        assert_equals(page.plainText, "request handled");
    }));

}, "round-trip of URLs containing encoded non-Unicode text");

async_test(function () {
    var page = require("webpage").create();
    var url = "http://localhost:"+port+"/foo/bar.txt?asdf=true";

    arm_check_request(this,
        {"answer" : "42", "universe" : "expanding"}, false);

    page.open(url, "post", "universe=expanding&answer=42",
              { "Content-Type" : "application/x-www-form-urlencoded" },
              this.step_func_done(function (status) {
        assert_equals(status, "success");
        assert_equals(page.plainText, "request handled");
    }));

}, "handling POST with application/x-www-form-urlencoded data", {
    expected_fail: true /* unsupported */
});

async_test(function () {
    var page = require("webpage").create();
    var url = "http://localhost:"+port+"/foo/bar.txt?asdf=true";

    arm_check_request(this,
        {"answer" : "42", "universe" : "expanding"}, false);

    page.open(url, "post", "universe=expanding&answer=42",
              { "Content-Type" : "application/json;charset=UTF-8" },
              this.step_func_done(function (status) {
        assert_equals(status, "success");
        assert_equals(page.plainText, "request handled");
    }));

}, "handling POST with ill-formed application/json data", {
    expected_fail: true /* unsupported */
});

async_test(function () {
    var page = require("webpage").create();
    var url = "http://localhost:"+port+"/";
    var fs = require("fs");
    var png = fs.read(fs.join(phantom.libraryPath,
                              "../../www/phantomjs.png"), "b");

    arm_check_request(this, false, png, "image/png");
    page.open(url, "get", this.step_func_done(function (status) {
        assert_equals(status, "success");
        function checkImg() {
            var img = document.querySelector("img");
            if (img) {
                return { w: img.width, h: img.height };
            } else {
                return {};
            }
        }
        // XFAIL: image doesn't load properly and we receive the dimensions of
        // the ?-in-a-box placeholder
        assert_deep_equals(page.evaluate(checkImg), { w: 200, h: 200 });
    }));

}, "handling binary data", {
    skip: true,           // crash: https://github.com/ariya/phantomjs/issues/13461
    expected_fail: true   // received image is corrupt:
                          // https://github.com/ariya/phantomjs/issues/13026
                          // and perhaps others
});
