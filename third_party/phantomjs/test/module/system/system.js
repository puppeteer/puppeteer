var system = require('system');

test(function () {
    assert_type_of(system, 'object');
    assert_not_equals(system, null);
}, "system object");

test(function () {
    assert_own_property(system, 'pid');
    assert_type_of(system.pid, 'number');
    assert_greater_than(system.pid, 0);
}, "system.pid");

test(function () {
    assert_own_property(system, 'isSSLSupported');
    assert_type_of(system.isSSLSupported, 'boolean');
    assert_equals(system.isSSLSupported, true);
}, "system.isSSLSupported", {/* unsupported */expected_fail: true});

test(function () {
    assert_own_property(system, 'args');
    assert_type_of(system.args, 'object');
    assert_instance_of(system.args, Array);
    assert_greater_than_equal(system.args.length, 1);

    // args[0] will be the test harness.
    assert_regexp_match(system.args[0], /\btestharness\.js$/);
}, "system.args", {/* unsupported */expected_fail: true});

test(function () {
    assert_own_property(system, 'env');
    assert_type_of(system.env, 'object');
}, "system.env");

test(function () {
    assert_own_property(system, 'platform');
    assert_type_of(system.platform, 'string');
    assert_equals(system.platform, 'phantomjs');
}, "system.platform");

test(function () {
    assert_own_property(system, 'os');
    assert_type_of(system.os, 'object');

    assert_type_of(system.os.architecture, 'string');
    assert_type_of(system.os.name, 'string');
    assert_type_of(system.os.version, 'string');

    if (system.os.name === 'mac') {
        // release is x.y.z with x = 10 for Snow Leopard and 14 for Yosemite
        assert_type_of(system.os.release, 'string');
        assert_greater_than_equal(parseInt(system.os.release, 10), 10);
    }
}, "system.os");

test(function () {
    assert_type_of(system.stdin, 'object');
    assert_type_of(system.stdin.read, 'function');
    assert_type_of(system.stdin.readLine, 'function');
    assert_type_of(system.stdin.close, 'function');
}, "system.stdin");

test(function () {
    assert_type_of(system.stdout, 'object');
    assert_type_of(system.stdout.write, 'function');
    assert_type_of(system.stdout.writeLine, 'function');
    assert_type_of(system.stdout.flush, 'function');
    assert_type_of(system.stdout.close, 'function');
}, "system.stdout");

test(function () {
    assert_type_of(system.stderr, 'object');
    assert_type_of(system.stderr.write, 'function');
    assert_type_of(system.stderr.writeLine, 'function');
    assert_type_of(system.stderr.flush, 'function');
    assert_type_of(system.stderr.close, 'function');
}, "system.stderr");
