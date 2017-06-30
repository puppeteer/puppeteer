var webpage = require('webpage');

async_test(function () {
    var page = webpage.create();

    var url = TEST_HTTP_BASE + "cdn-cgi/pe/bag?r%5B%5D="+
              "http%3A%2F%2Fwww.example.org%2Fcdn-cgi%2Fnexp%2F"+
              "abv%3D927102467%2Fapps%2Fabetterbrowser.js";
    var receivedUrl;

    page.onResourceRequested = this.step_func(function(requestData, request) {
        request.changeUrl(requestData.url);
    });

    page.onResourceReceived = this.step_func(function(data) {
        if (data.stage === 'end') {
            receivedUrl = data.url;
        }
    });

    page.open(url, this.step_func_done(function (status) {
        assert_equals(status, 'success');
        assert_equals(receivedUrl, url);
    }));

}, "encoded URLs properly round-trip through request.changeUrl");
