//! unsupported
function validate_echo_response (status, page, postdata) {
    assert_equals(status, 'success');

    var desc = JSON.parse(page.plainText);
    assert_equals(desc.command, "POST");
    assert_equals(desc.postdata, postdata);
    assert_equals(desc.headers['content-type'],
                  'application/x-www-form-urlencoded');
}

async_test(function () {

    var utfString = '안녕';
    var openOptions = {
        operation: 'POST',
        data:       utfString,
        encoding:  'utf8'
    };
    var pageOptions = {
        onLoadFinished: this.step_func_done(function(status) {
            validate_echo_response(status, page, utfString);
        })
    };
    var page = new WebPage(pageOptions);
    page.openUrl(TEST_HTTP_BASE + "echo", openOptions, {});


}, "processing request body for POST");

async_test(function () {

    var postdata = "ab=cd";
    var pageOptions = {
        onResourceRequested: this.step_func(function (request) {
            assert_equals(request.postData, postdata);
        }),
        onLoadFinished: this.step_func_done(function (status) {
            validate_echo_response(status, page, postdata);
        })
    };

    var page = new WebPage(pageOptions);
    page.open(TEST_HTTP_BASE + "echo", 'post', postdata);


}, "POST data is available in onResourceRequested");
