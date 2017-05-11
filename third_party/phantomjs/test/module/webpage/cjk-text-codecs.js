var webpage = require('webpage');

function test_one(text) {
    var t = async_test(text.codec);
    t.step(function () {
        var page = webpage.create();
        page.open(text.url, t.step_func_done(function () {
            var decodedText = page.evaluate(function() {
                return document.querySelector('pre').innerText;
            });
            var regex = '^' + text.reference + '$';
            assert_regexp_match(text.reference, new RegExp(regex));
        }));
    });
}

function Text(codec, base64, reference) {
    this.codec = codec;
    this.base64 = base64;
    this.reference = reference;
    this.url = 'data:text/plain;charset=' + this.codec +
               ';base64,' + this.base64;
}

[
    new Text('Shift_JIS', 'g3SDQIOTg2eDgA==', 'ファントム'),
    new Text('EUC-JP', 'pdWloaXzpcil4A0K', 'ファントム'),
    new Text('ISO-2022-JP', 'GyRCJVUlISVzJUglYBsoQg0K', 'ファントム'),
    new Text('Big5', 'pNu2SA0K', '幻象'),
    new Text('GBK', 'u8PP8w0K', '幻象'),
    new Text('EUC-KR', 'yK+/tQ==', '환영'),
]
    .forEach(test_one);
