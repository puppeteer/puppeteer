test(function () {
    assert_type_of(Function.length, 'number');
    assert_type_of(Function.prototype, 'function');
    assert_type_of(Function.prototype.apply, 'function');
    assert_type_of(Function.prototype.bind, 'function');
    assert_type_of(Function.prototype.call, 'function');
    assert_type_of(Function.prototype.name, 'string');
    assert_type_of(Function.prototype.toString, 'function');
}, "Function properties");

test(function () {
    var f = function foo(){};
    assert_equals(f.name, 'foo');
}, "<function>.name");

test(function () {
    assert_equals(Function.length, 1);
    assert_equals(function(){}.length, 0);
    assert_equals(function(x){}.length, 1);
    assert_equals(function(x, y){}.length, 2);
    assert_equals(function(x, y){}.length, 2);
}, "<function>.length");

test(function () {
    var args, keys, str, enumerable;
    (function() {
        args = arguments;
        keys = Object.keys(arguments);
        str = JSON.stringify(arguments);
        enumerable = false;
        for (var i in arguments) enumerable = true;
    })(14);

    assert_type_of(args, 'object');
    assert_type_of(args.length, 'number');
    assert_equals(args.toString(), '[object Arguments]');
    assert_equals(args.length, 1);
    assert_equals(args[0], 14);

    assert_type_of(keys.length, 'number');
    assert_equals(keys.length, 1);
    assert_equals(keys[0], "0");

    assert_equals(str, '{"0":14}');
    assert_is_true(enumerable);
}, "arguments object");
