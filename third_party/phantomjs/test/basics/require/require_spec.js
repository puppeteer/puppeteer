var fs = require('fs');
var tests = [];
exports.tests = tests;

tests.push([function () {
    assert_no_property(window, 'CoffeeScript');
    assert_own_property(window, 'require');

    assert_own_property(require('webpage'), 'create');
    assert_own_property(require('webserver'), 'create');
    assert_own_property(require('cookiejar'), 'create');

    assert_own_property(require('fs'), 'separator');
    assert_equals(require('system').platform, 'phantomjs');

}, "native modules"]);

tests.push([function () {
    assert_equals(require('./json_dummy').message, 'hello');
    assert_equals(require('./dummy.js'), 'require/dummy');
}, "JS and JSON modules"]);

tests.push([function () {
    require('./empty').hello = 'hola';
    assert_equals(require('./empty').hello, 'hola');

    // assert_own_property rejects Functions
    assert_equals(require.hasOwnProperty('cache'), true);

    var exposed = require('dummy_exposed');
    assert_equals(require.cache[exposed.filename], exposed);

}, "module caching"]);

tests.push([function () {
    var a = require('./a');
    var b = require('./b');
    assert_equals(a.b, b);
    assert_equals(b.a, a);
}, "circular dependencies"]);

tests.push([function () {
    assert_throws("Cannot find module 'dummy_missing'",
                  function () { require('dummy_missing'); });

    try {
        require('./not_found').requireNonExistent();
    } catch (e) {
        assert_regexp_match(e.stack, /at require /);
    }
}, "error handling 1"]);

tests.push([function error_handling_2 () {
    try {
        require('./thrower').fn();
    } catch (e) {
        assert_regexp_match(e.toString() + "\n" + e.stack,
            /^Error: fn\nError: fn\n    at Object.thrower/);
    }
}, "error handling 2"]);

tests.push([function () {
    assert_equals(require('./stubber').stubbed, 'stubbed module');
    assert_equals(require('./stubber').child.stubbed, 'stubbed module');
    assert_throws("Cannot find module 'stubbed'",
                  function () { require('stubbed'); });

    var count = 0;
    require.stub('lazily_stubbed', function() {
        ++count;
        return 'lazily stubbed module';
    });

    assert_equals(require('lazily_stubbed'), 'lazily stubbed module');
    require('lazily_stubbed');
    assert_equals(count, 1);

}, "stub modules"]);

tests.push([function () {
    assert_equals(require('./dummy'),               'require/dummy');
    assert_equals(require('../fixtures/dummy'),     'spec/dummy');
    assert_equals(require('./dir/dummy'),           'dir/dummy');
    assert_equals(require('./dir/subdir/dummy'),    'subdir/dummy');
    assert_equals(require('./dir/../dummy'),        'require/dummy');
    assert_equals(require('./dir/./dummy'),         'dir/dummy');
    assert_equals(require(
        fs.absolute(module.dirname + '/dummy.js')), 'require/dummy');

}, "relative and absolute paths"]);

tests.push([function () {
    assert_equals(require('dummy_file'), 'require/node_modules/dummy_file');
    assert_equals(require('dummy_file2'), 'spec/node_modules/dummy_file2');
    assert_equals(require('./dir/subdir/loader').dummyFile2,
                  'spec/node_modules/dummy_file2');
    assert_equals(require('dummy_module'),
                  'require/node_modules/dummy_module');
    assert_equals(require('dummy_module2'),
                  'require/node_modules/dummy_module2');
}, "loading from node_modules"]);

function require_paths_tests_1 () {
    assert_equals(require('loader').dummyFile2,
                  'spec/node_modules/dummy_file2');
    assert_equals(require('../subdir2/loader'),
                  'require/subdir2/loader');
    assert_equals(require('../fixtures/dummy'), 'spec/dummy');
}
function require_paths_tests_2 () {
    assert_throws("Cannot find module 'loader'",
                  function () { require('loader'); });
}

tests.push([function () {
    require.paths.push('dir/subdir');
    this.add_cleanup(function () { require.paths.pop(); });
    require_paths_tests_1();
}, "relative paths in require.paths"]);

tests.push([
    require_paths_tests_2, "relative paths in require paths (after removal)"]);

tests.push([function () {
    require.paths.push(fs.absolute(module.dirname + '/dir/subdir'));
    this.add_cleanup(function () { require.paths.pop(); });
    require_paths_tests_1();
}, "absolute paths in require.paths"]);

tests.push([
    require_paths_tests_2, "relative paths in require paths (after removal)"]);
