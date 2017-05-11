// Test the properties of the 'module' object.
// Assumes the 'dummy_exposed' module is to be found in a directory
// named 'node_modules'.

// Module load might fail, so do it in a setup function.
var module;
setup(function () {
    module = require("dummy_exposed");
});

test(function() {
    assert_regexp_match(module.filename, /\/node_modules\/dummy_exposed\.js$/);
}, "module.filename is the absolute pathname of the module .js file");

test(function() {
    assert_regexp_match(module.dirname, /\/node_modules$/);
}, "module.dirname is the absolute pathname of the directory containing "+
   "the module");

test(function() {
    assert_equals(module.id, module.filename);
}, "module.id equals module.filename");

test(function() {
    var dummy_file = module.require('./dummy_file');
    assert_equals(dummy_file, 'spec/node_modules/dummy_file');
}, "module.require is callable and resolves relative to the module");
