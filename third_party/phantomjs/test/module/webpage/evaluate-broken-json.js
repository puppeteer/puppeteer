test(function () {
    var webpage = require('webpage');
    var page = webpage.create();

    // Hijack JSON.parse to something completely useless.
    page.content = '<html><script>JSON.parse = function() {}</script></html>';

    var result = page.evaluate(function(obj) {
        return obj.value * obj.value;
    }, { value: 4 });

    assert_equals(result, 16);

}, "page script should not interfere with page.evaluate");
