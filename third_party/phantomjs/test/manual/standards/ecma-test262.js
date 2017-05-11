// Launch the official test suite for ECMA-262

var webpage = require('webpage');

page = webpage.create();
page.onError = function() {};

page.open('http://test262.ecmascript.org/', function() {
    page.evaluate(function() { $('a#run').click(); });
    page.evaluate(function() { $('img#btnRunAll').click(); });

    function monitor() {

        var data = page.evaluate(function() {
            return {
                ran: $('#totalCounter').text(),
                total: $('#testsToRun').text(),
                pass: $('#Pass').text(),
                fail: $('#Fail').text(),
                progress:  $('div#progressbar').text()
            };
        });

        console.log('Tests: ', data.ran, 'of', data.total,
            '     Pass:', data.pass, '  Fail:', data.fail);

        if (data.progress.indexOf('complete') > 0) {
            page.render('report.png');
            phantom.exit();
        } else {
            setTimeout(monitor, 1000);
        }
    }

    setTimeout(monitor, 0);
});
