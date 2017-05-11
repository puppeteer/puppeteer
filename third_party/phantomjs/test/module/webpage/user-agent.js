var webpage = require('webpage');

async_test(function () {
    var ua = 'PHANTOMJS-TEST-USER-AGENT';
    var page = webpage.create({
        settings: {
            userAgent: ua
        }
    });

    assert_equals(page.settings.userAgent, ua);

    page.open(TEST_HTTP_BASE + 'user-agent.html',
              this.step_func_done(function (status) {
        assert_equals(status, 'success');
        var agent = page.evaluate(function() {
            return document.getElementById('ua').textContent;
        });
        assert_equals(agent, ua);
    }));

}, "load a page with a custom user agent");
