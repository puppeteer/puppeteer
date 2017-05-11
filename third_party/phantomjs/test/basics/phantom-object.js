test(function () {
    assert_type_of(phantom, 'object');
}, "phantom object");

test(function () {
    assert_own_property(phantom, 'libraryPath');
    assert_type_of(phantom.libraryPath, 'string');
    assert_greater_than(phantom.libraryPath.length, 0);
}, "phantom.libraryPath");

test(function () {
    assert_own_property(phantom, 'outputEncoding');
    assert_type_of(phantom.outputEncoding, 'string');
    assert_equals(phantom.outputEncoding.toLowerCase(), 'utf-8'); // default
}, "phantom.outputEncoding");

test(function () {
    assert_own_property(phantom, 'injectJs');
    assert_type_of(phantom.injectJs, 'function');
}, "phantom.injectJs");

test(function () {
    assert_own_property(phantom, 'exit');
    assert_type_of(phantom.exit, 'function');
}, "phantom.exit");

test(function () {
    assert_own_property(phantom, 'cookiesEnabled');
    assert_type_of(phantom.cookiesEnabled, 'boolean');
    assert_is_true(phantom.cookiesEnabled);
}, "phantom.cookiesEnabled");

test(function () {
    assert_own_property(phantom, 'version');
    assert_type_of(phantom.version, 'object');
    assert_type_of(phantom.version.major, 'number');
    assert_type_of(phantom.version.minor, 'number');
    assert_type_of(phantom.version.patch, 'number');
}, "phantom.version");
