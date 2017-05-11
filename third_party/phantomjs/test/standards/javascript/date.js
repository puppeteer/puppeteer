test(function() {
    var date = new Date('2012-09-07');
    assert_not_equals(date.toString(), 'Invalid Date');
    assert_equals(date.getUTCDate(), 7);
    assert_equals(date.getUTCMonth(), 8);
    assert_equals(date.getYear(), 112);
}, "new Date()");

test(function () {
    var date = Date.parse("2012-01-01");
    assert_equals(date, 1325376000000);
}, "Date.parse()");
