/* The require tests need to run inside a module to work correctly; that
   module is require/require_spec.js.  (That directory also contains a
   bunch of other files used by this test.)  The module exports an array
   of test functions in the form expected by generate_tests(). */

var rtests = require("require/require_spec.js").tests;

for (var i = 0; i < rtests.length; i++) {
    test.apply(null, rtests[i]);
}
