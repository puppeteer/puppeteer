# How to Write Tests for PhantomJS

PhantomJS's automated tests are `.js` files located in subdirectories
of this directory.  The test runner, [`run-tests.py`](run-tests.py),
executes each as a PhantomJS controller script.  (Not all
subdirectories of this directory contain tests; the authoritative list
of test subdirectories is in
[the `TESTS` variable in `run-tests.py`](run-tests.py#L26).)

In addition to all of the usual PhantomJS API, these scripts have
access to a special testing API, loosely based on
[W3C testharness.js](https://github.com/w3c/testharness.js) and
defined in [`testharness.js`](testharness.js) in this directory.  They
also have access to HTTP and HTTPS servers on `localhost`, which serve
the files in the [`www`](www) directory.

## The Structure of Test Scripts

Test scripts are divided into _subtests_.  There are two kinds of
subtest: synchronous and asynchronous.  The only difference is that a
synchronous subtest consists of a single JavaScript function (plus
anything it calls) and is considered to be complete when that function
returns.  An asynchronous subtest, however, consists of many
JavaScript functions; these functions are referred to as _steps_.  One
step will be invoked to start the subtest, and the others are called
in response to events.  Eventually one of the steps will indicate that
the subtest is complete.  (The single function used for a synchronous
subtest is also referred to as a step, when the difference doesn't
matter.)

All of the code in a test script should be part of a subtest, or part
of a setup function (see below).  You may define helper functions at
top level, so long as they are only ever _called_ from subtests.  You
may also initialize global variables at top level if this
initialization cannot possibly fail, e.g. with constant data or with
`require` calls for core PhantomJS modules.

The testing API is visible to a test script as a collection of global
functions and variables, documented below.

A subtest is considered to have failed if any of its steps throws a
JavaScript exception, if an `unreached_func` is called, if the
per-test timeout expires, or if `done` is called before all of its
steps have run.  It is considered to succeed if `done` is called
(explicitly or implicitly) after all of its steps have run to
completion.  Normally, you should use the assertion functions to detect
failure conditions; these ensure that clear diagnostic information is
printed when a test fails.

Subtests are executed strictly in the order they appear in the file,
even if some of them are synchronous and some are asynchronous.  The
order of steps *within* an asynchronous subtest, however, may be
unpredictable.  Also, subtests do not begin to execute until after all
top-level code in the file has been evaluated.

Some anomalous conditions are reported not as a failure, but as an
"error".  For instance, if PhantomJS crashes during a test run, or if
an exception is thrown from outside a step, that is an error, and the
entire test will be abandoned.

**WARNING:** The harness will become confused if any function passed
as the `func` argument to `test`, `async_test`, `generate_tests`,
`Test.step`, `Test.step_func`, `Test.step_func_done`, or
`Test.add_cleanup` has a name that ends with `_step`.

### Accessing the HTTP and HTTPS Test Servers

The global variables `TEST_HTTP_BASE` and `TEST_HTTPS_BASE` are the
base URLs of the test HTTP and HTTPS servers, respectively.  Their
values are guaranteed to match the regex `/https?:\/\/localhost:[0-9]+\//`,
but the port number is dynamically assigned for each test run, so you
must not hardwire it.

### Synchronous Subtests

There are two functions for defining synchronous subtests.

* `test(func, name, properties)`

  Run `func` as a subtest; the subtest is considered to be complete as
  soon as it returns.  `name` is an optional descriptive name for the
  subtest.  `func` will be called with no arguments, and `this` set to
  a `Test` object (see below).  `properties` is an optional object
  containing properties to apply to the test.  Currently there are
  three meaningful properties; any other keys in the `properties`
  object are ignored:

  * `timeout` - Maximum amount of time the subtest is allowed to run, in
    milliseconds.  If the timeout expires, the subtest will be
    considered to have failed.

  * `expected_fail`: If truthy, this subtest is expected to fail.  It will
    still be run, but a failure will be considered "normal" and the
    overall test will be reported as successful.  Conversely, if the
    subtest *succeeds* that is considered "abnormal" and the overall
    test will be reported as failing.

  * `skip`: If truthy, this subtest will not be run at all, will be
    reported as "skipped" rather than "succeeded" or "failed", and
    will not affect the overall outcome of the test.  Use `skip` only
    when `expected_fail` will not do—for instance, when a test
    provokes a PhantomJS crash (there currently being no way to label
    a crash as "expected").

  `test` returns the same `Test` object that is available as `this`
  within `func`.

* `generate_tests(func, args, properties)`

  Define a group of synchronous subtests, each of which will call
  `func`, but with different arguments.  This is easiest to explain by
  example:

        generate_tests(assert_equals, [
            ["Sum one and one",  1 + 1, 2],
            ["Sum one and zero", 1 + 0, 1]
        ]);

  ... is equivalent to ...

        test(function() {assert_equals(1+1, 2)}, "Sum one and one");
        test(function() {assert_equals(1+0, 1)}, "Sum one and zero");

  Of course `func` may be as complicated as you like, and there is no
  limit either to the number of arguments passed to each subtest, or
  to the number of subtests.

  The `properties` argument may be a single properties object, which
  will be applied uniformly to all the subtests, or an array of the
  same length as `args`, containing appropriate property objects for
  each subtest.

  `generate_tests` returns no value.

### Asynchronous Subtests

An asynchronous subtest consists of one or more _step_ functions, and
unlike a synchronous subtest, it is not considered to be complete until
the `done` method is called on its `Test` object.  When this happens,
if any of the step functions have not been executed, the subtest is a
failure.

Asynchronous subtests are defined with the `async_test` function, which
is almost the same as `test`:

* `async_test(func, name, properties)`

  Define an asynchronous subtest.  The arguments and their
  interpretation are the same as for `test`, except that `func` is
  optional, and the subtest is *not* considered to be complete after
  `func` returns; `func` (if present) is only the first step of the
  subtest.  Additional steps may be defined, either within `func` or
  outside the call to `async_test`, by use of methods on the `Test`
  object that is returned (and available as `this` within `func`).

  Normally, an asynchronous subtest's first step will set up whatever
  is being tested, and define the remainder of the steps, which will
  be run in response to events.

### Test Object Methods

These methods are provided by the `Test` object which is returned by
`test` and `async_test`, and available as `this` within step
functions.

* `Test.step(func[, this_obj, ...])`

  Queue one step of a subtest.  `func` will eventually be called, with
  `this` set to `this_obj`, or (if `this_obj` is null or absent) to
  the `Test` object.  Any further arguments will be passed down to
  `func`.  `func` will _not_ be called if a previous step has failed.

  Do not use this function to define steps that should run in response
  to event callbacks; only steps that should be automatically run by
  the test harness.

  The object returned by this function is private.  Please let us know
  if you think you need to use it.

* `Test.done()`

  Indicate that this subtest is complete.  One, and only one, step of
  an asynchronous subtest must call this function, or the subtest will
  never complete (and eventually it will time out).

  If an asynchronous subtest has several steps, but not all of them
  have run when `done` is called, the subtest is considered to have
  failed.

* `Test.step_func(func[, this_obj])`

  Register `func` as a step that will *not* be run automatically by
  the test harness.  Instead, the function *returned* by this function
  (the "callback") will run `func`'s step when it is called.
  (`func`'s step must still somehow get run before `done` is called,
  or the subtest will be considered to have failed.)

  `this_obj` will be supplied as `this` to `func`; if omitted, it
  defaults to the `Test` object.  Further arguments are ignored.
  However, `func` will receive all of the arguments passed to the
  callback, and the callback will return whatever `func` returns.

  This is the normal way to register a step that should run in
  response to an event.  For instance, here is a minimal test of a
  page load:

      async_test(function () {
          var p = require('webpage').create();
          p.open(TEST_HTTP_BASE + 'hello.html',
                 this.step_func(function (status) {
              assert_equals(status, 'success');
              this.done();
          }));
      });

  This also serves to illustrate why asynchronous subtests may be
  necessary: this subtest is not complete when its first step returns,
  only when the `onLoadFinished` event fires.

* `Test.step_func_done([func[, this_obj]])`

  Same as `Test.step_func`, but the callback additionally calls `done`
  after `func` returns.  `func` may be omitted, in which case the
  callback just calls `done`.

  The example above can be shortened to

      async_test(function () {
          var p = require('webpage').create();
          p.open(TEST_HTTP_BASE + 'hello.html',
                 this.step_func_done(function (status) {
              assert_equals(status, 'success');
          }));
      });

* `Test.unreached_func([description])`

  Returns a function that, if called, will call
  `assert_unreached(description)` inside a step.  Use this to set
  event handlers for events that should _not_ happen.  You need to use
  this method instead of `step_func(function () { assert_unreached(); })`
  so the step is properly marked as expected _not_ to run; otherwise
  the test will fail whether or not the event happens.

  A slightly more thorough test of a page load might read

      async_test(function () {
          var p = require('webpage').create();
          p.onResourceError = this.unreached_func("onResourceError");
          p.open(TEST_HTTP_BASE + 'hello.html',
                 this.step_func_done(function (status) {
              assert_equals(status, 'success');
          }));
      });

* `Test.add_cleanup(func)`

  Register `func` to be called (with no arguments, and `this` set to
  the `Test` object) when `done` is called, whether or not the subtest
  has failed.  Use this to deallocate persistent resources or undo
  changes to global state.  For example, a subtest that uses a scratch
  file might read

      test(function () {
          var fs = require('fs');
          var f = fs.open('scratch_file', 'w');
          this.add_cleanup(function () {
              f.close();
              fs.remove('scratch_file');
          });

          // ... more test logic here ...
      });

  If the step function had simply deleted the file at its end, the
  file would only get deleted when the test succeeds.  This example
  could be rewritten using `try ... finally ...`, but that will not
  work for asynchronous tests.

* `Test.fail(message)`

  Explicitly mark this subtest has having failed, with failure message
  `message`.  You should not normally need to call this function yourself.

* `Test.force_timeout()`

  Explicitly mark this subtest as having failed because its timeout has
  expired.  You should not normally need to call this function yourself.

### Test Script-Wide Setup

All of the subtests of a test script are normally run, even if one of
them fails.  Complex tests may involve complex initialization actions
that may fail, in which case the entire test script should be aborted.
There is also a small amount of harness-wide configuration that is
possible.  Both these tasks are handled by the global function
`setup`.

* `setup([func], [properties])`

  One may specify either `func` or `properties` or both, but if both
  are specified, `func` must be first.

  `func` is called immediately, with no arguments.  If it throws an
  exception, the entire test script is considered to have failed and
  none of the subtests are run.

  `properties` is an object containing one or more of the following
  keys:

  * `explicit_done`: Wait for the global function `done` (not to be
    confused with `Test.done` to be called, before declaring the test
    script complete.

  * `allow_uncaught_exception`: Don't treat an uncaught exception from
    non-test code as an error.  (Exceptions thrown out of test steps
    are still errors.)

  * `timeout`: Overall timeout for the test script, in milliseconds.
    The default is five seconds.  Note that `run-tests.py` imposes a
    "backstop" timeout itself; if you raise this timeout you may also
    need to raise that one.

  * `test_timeout`: Default timeout for individual subtests.  This may
    be overridden by the `timeout` property on a specific subtest.
    The default is not to have a timeout for individual subtests.


### Assertions

Whenever possible, use these functions to detect failure conditions.
All of them either throw a JavaScript exception (when the test fails)
or return no value (when the test succeeds).  All take one or more
values to be tested, and an optional _description_.  If present, the
description should be a string to be printed to clarify why the test
has failed.  (The assertions all go to some length to print out values
that were not as expected in a clear format, so descriptions will
often not be necessary.)

* `assert_is_true(value[, description])`

  `value` must be strictly equal to `true`.

* `assert_is_false(value[, description])`

  `value` must be strictly equal to `false`.

* `assert_equals(actual, expected[, description])`

  `actual` and `expected` must be shallowly, strictly equal.  The
  criterion used is `===` with the following exceptions:

  * If `x === y`, but one of them is `+0` and the other is `-0`, they
    are *not* considered equal.

  * If `x !== y`, but one of the following cases holds, they *are*
    considered equal:
    * both are `NaN`
    * both are `Date` objects and `x.getTime() === y.getTime()`
    * both are `RegExp` objects and `x.toString() === y.toString()`

* `assert_not_equals(actual, expected[, description])`

  `actual` and `expected` must *not* be shallowly, strictly equal,
  using the same criterion as `assert_equals`.

* `assert_deep_equals(actual, expected[, description])`

  If `actual` and `expected` are not objects, or if they are
  `Date` or `RegExp` objects, this is the same as `assert_equals`.

  Objects that are not `Date` or `RegExp` must have the same set of
  own-properties (including non-enumerable own-properties), and each
  pair of values for with each own-property must be `deep_equals`,
  recursively.  Prototype chains are ignored.  Back-references are
  detected and ignored; they will not cause an infinite recursion.

* `assert_approx_equals(actual, expected, epsilon[, description])`

  The absolute value of the difference between `actual` and `expected`
  must be no greater than `epsilon`.  All three arguments must be
  primitive numbers.

* `assert_less_than(actual, expected[, description])`
* `assert_less_than_equal(actual, expected[, description])`
* `assert_greater_than(actual, expected[, description])`
* `assert_greater_than_equal(actual, expected[, description])`

  `actual` and `expected` must be primitive numbers, and `actual` must
  be, respectively: less than, less than or equal to, greater than,
  greater than or equal to `expected`.

* `assert_in_array(value, array[, description])`

  `array` must contain `value` according to `Array.indexOf`.

* `assert_regexp_match(string, regexp[, description])`

  The regular expression `regexp` must match the string `string`,
  according to `RegExp.test()`.

* `assert_regexp_not_match(string, regexp[, description])`

  The regular expression `regexp` must *not* match the string `string`,
  according to `RegExp.test()`.

* `assert_type_of(object, type[, description])`

  `typeof object` must be strictly equal to `type`.

* `assert_instance_of(object, type[, description])`

  `object instanceof type` must be true.

* `assert_class_string(object, expected[, description])`

  `object` must have the class string `expected`.  The class string is
  the second word in the string returned by `Object.prototype.toString`:
  for instance, `({}).toString.call([])` returns `[object Array]`, so
  `[]`'s class string is `Array`.

* `assert_own_property(object, name[, description])`

  `object` must have an own-property named `name`.

* `assert_inherits(object, name[, description])`

  `object` must inherit a property named `name`; that is,
  `name in object` must be true but `object.hasOwnProperty(name)`
  must be false.

* `assert_no_property(object, name[, description])`

  `object` must neither have nor inherit a property named `name`.

* `assert_readonly(object, name[, description])`

  `object` must have an own-property named `name` which is marked
  read-only (according to `Object.getOwnPropertyDescriptor`).

* `assert_throws(code, func[, description])`

  `func` must throw an exception described by `code`.  `func` is
  called with no arguments and no `this` (you can supply arguments
  using `bind`).  `code` can take one of two forms.  If it is a
  string, the thrown exception must either stringify to that string,
  or it must be a DOMException whose `name` property is that string.
  Otherwise, `code` must be an object with one or more of the
  properties `code`, `name`, and `message`; whichever properties are
  present must be `===` to the corresponding properties of the
  exception.  As a special case, if `message` is present in the
  `code` object but *not* on the exception object, and the exception
  stringifies to the same string as `message`, that's also considered
  valid.

  `assert_throws` cannot be used to catch the exception thrown by any
  of the other `assert_*` functions when they fail.  (You might be
  looking for the `expected_fail` property on a subtest.)

* `assert_unreached([description])`

  Control flow must not reach the point where this assertion appears.
  (In other words, this assertion fails unconditionally.)

## Test Annotations

Some tests need to be run in a special way.  You can indicate this to
the test runner with _annotations_.  Annotations are lines in the test
script that begin with the three characters '`//!`'.  They must be all
together at the very top of the script; `run-tests.py` stops parsing
at the first line that does _not_ begin with the annotation marker.

Annotation lines are split into _tokens_ in a shell-like fashion,
which means they are normally separated by whitespace, but you can use
backslashes or quotes to put whitespace inside a token.  Backslashes
are significant inside double quotes, but not inside single quotes.
There can be any number of tokens on a line.  Everything following an
unquoted, un-backslashed `#` is discarded.  (The exact algorithm is
[`shlex.split`](https://docs.python.org/2/library/shlex.html), in
`comments=True`, `posix=True` mode.)

These are the recognized tokens:

* `no-harness`: Run this test script directly; the testing API
  described above will not be available.  This is necessary to
  test PhantomJS features that `testharness.js` reserves for its
  own use, such as `phantom.onError` and `phantom.exit`.  No-harness
  tests will usually also be output-expectations tests (see below)
  but this is not required.

* `snakeoil`: Instruct PhantomJS to accept the self-signed
  certificate presented by the HTTPS test server.

* `timeout:` The next token on the line must be a positive
  floating-point number.  `run-tests.py` will kill the PhantomJS
  process, and consider the test to have failed, if it runs for longer
  than that many seconds.  The default timeout is seven seconds.

  This timeout is separate from the per-subtest and global timeouts
  enforced by the testing API.  It is intended as a backstop against
  bugs which cause PhantomJS to stop executing the controller script.
  (In no-harness mode, it's the only timeout, unless you implement
  your own.)

* `phantomjs:` All subsequent tokens on the line will be passed as
  command-line arguments to PhantomJS, before the controller script.
  Note that `run-tests.py` sets several PhantomJS command line options
  itself; you must take care not to do something contradictory.

* `script:` All subsequent tokens on the line will be passed as
  command-line arguments to the *controller script*; that is, they
  will be available in
  [`system.args`](http://phantomjs.org/api/system/property/args.html).
  Note that your controller script will only be `system.args[0]` if
  you are using no-harness mode, and that `run-tests.py` may pass
  additional script arguments of its own.

* `stdin:` All subsequent tokens on the line will be concatenated
  (separated by a single space) and fed to PhantomJS's standard input,
  with a trailing newline.  If this token is used more than once,
  that produces several lines of input.  If this token is not used at
  all, standard input will read as empty.

* `unsupported:` The whole file will be skipped.
  This directive should be used to notify that the functionality is not yet
  implemented by Puppeteer. Tests could be run ignoring this directive
  with the `--run-unsupported` flag.

## Output-Expectations Tests

Normally, `run-tests.py` expects each test to produce parseable output
in the [TAP](http://testanything.org/tap-specification.html) format.
This is too inflexible for testing things like `system.stdout.write`,
so there is also a mode in which you specify exactly what output the
test should produce, with additional annotations.  Output-expectations
tests are not *required* to be no-harness tests, but the only reason
to use this mode for harness tests would be to test the harness
itself, and it's not sophisticated enough for that.

Using any of the following annotations makes a test an
output-expectations test:

* `expect-exit:` The next token on the line must be an integer.  If it
  is nonnegative, the PhantomJS process is expected to exit with that
  exit code.  If it is negative, the process is expected to be
  terminated by the signal whose number is the absolute value of the
  token.  (For instance, `expect-exit: -15` for a test that is
  expected to hit the backstop timeout.)

* `expect-stdout:` All subsequent tokens on the line are concatenated,
  with spaces in between, and a newline is appeneded.  The PhantomJS
  process is expected to emit that text, verbatim, on its standard
  output.  If used more than once, that produces multiple lines of
  expected output.

* `expect-stderr:` Same as `expect-stdout`, but the output is expected
  to appear on standard error.

* `expect-exit-fails`, `expect-stdout-fails`, `expect-stderr-fails`:
  The corresponding test (of the exit code, stdout, or stderr) is
  expected to fail.

If some but not all of these annotations are used in a test, the
omitted ones default to exit code 0 (success) and no output on their
respective streams.

## Test Server Modules

The HTTP and HTTPS servers exposed to the test suite serve the static
files in the `www` subdirectory with URLs corresponding to their paths
relative to that directory.  If you need more complicated server
behavior than that, you can write custom Python code that executes
when the server receives a request.  Any `.py` file below the `www`
directory will be invoked to provide the response for that path
*without* the `.py` suffix.  (For instance, `www/echo.py` provides
responses for `TEST_HTTP_BASE + 'echo'`.)  Such files must define a
top-level function named `handle_request`.  This function receives a
single argument, which is an instance of a subclass of
[`BaseHTTPServer.BaseHTTPRequestHandler`](https://docs.python.org/2/library/basehttpserver.html#BaseHTTPServer.BaseHTTPRequestHandler).
The request headers and body (if any) may be retrieved from this
object.  The function must use the `send_response`, `send_header`, and
`end_headers` methods of this object to generate HTTP response
headers, and then return a *file-like object* (**not** a string)
containing the response body.  The function is responsible for
generating appropriate `Content-Type` and `Content-Length` headers;
the server framework does not do this automatically.

Test server modules cannot directly cause a test to fail; the server
does not know which test is responsible for any given request.  If
there is something wrong with a request, generate an HTTP error
response; then write your test to fail if it receives an error
response.

Python exceptions thrown by test server modules are treated as
failures *of the testsuite*, but they are all attributed to a virtual
"HTTP server errors" test.
