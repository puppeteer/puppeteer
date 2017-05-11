// These are cursory tests; we assume the underlying Qt
// features are properly tested elsewhere.

test(function () {
    assert_equals(
        phantom.resolveRelativeUrl(
            "../scripts/foo.js",
            "http://example.com/topic/page.html"),
        "http://example.com/scripts/foo.js");

    assert_equals(
        phantom.fullyDecodeUrl(
        "https://ja.wikipedia.org/wiki/%E8%87%A8%E6%B5%B7%E5%AD%A6%E6%A0%A1"),
        "https://ja.wikipedia.org/wiki/臨海学校");

}, "resolveRelativeUrl and fullyDecodeUrl");
