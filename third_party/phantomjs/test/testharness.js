/* vim: set expandtab shiftwidth=4 tabstop=4: */
/*global require, phantom, setTimeout, clearTimeout */

/*
  This file is part of the PhantomJS project from Ofi Labs.

  Copyright 2015 Zachary Weinberg <zackw@panix.com>

  Based on testharness.js <https://github.com/w3c/testharness.js>
  produced by the W3C and distributed under the W3C 3-Clause BSD
  License <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

(function () {

"use strict";

/** Public API: Defining and running tests.
 *
 *  Compared to the W3C testharness.js, a number of minor changes have
 *  been made to fit the rather different PhantomJS controller
 *  environment, but the basic API is the same.
 */

/** Define an asynchronous test.  Returns a Test object.  In response
    to appropriate events, call the Test object's step() method,
    passing a function containing assertions (as for synch tests).
    Eventually, call the Test object's done() method (inside a step).

    All arguments are optional.  If |func| is provided, it is called
    immediately (after the previous test completes) as the first step
    function.  |properties| is the same as for test().

    Test has several convenience methods for creating step functions,
    see below. */
function async_test(func, name, properties) {
    var test_obj;

    if (func && typeof func !== "function") {
        properties = name;
        name = func;
        func = null;
    }
    test_obj = new Test(test_name(func, name), properties);
    if (func) {
        test_obj.step(func);
    }
    return test_obj;
}
expose(async_test, 'async_test');

/** Define a synchronous test, which is just an asynchronous test that
    calls done() immediately after its first step function (func) returns.

    |func| is a function containing the test code, and |name|
    (optionally) is a descriptive name for the test.  |func| will be
    called (after the previous test completes), with |this| a Test
    object (see below), and should make use of the global assert_*
    functions.  |properties| is an optional dictionary of test
    properties; currently only one is defined:

    timeout - Timeout for this test, in milliseconds. */
function test(func, name, properties) {
    return async_test(function sync_step () {
        func.call(this);
        this.done();
    }, name, properties);
}
expose(test, 'test');

/** Define a series of synchronous tests all at once.
    Easiest to explain by example:

    generate_tests(assert_equals, [
        ["Sum one and one", 1+1, 2],
        ["Sum one and zero", 1+0, 1]
    ]);

    is equivalent to

    test(function() {assert_equals(1+1, 2)}, "Sum one and one");
    test(function() {assert_equals(1+0, 1)}, "Sum one and zero");

    The first argument can be an arbitrary function, and you can provide
    as many arguments in each test vector entry as you like.

    The properties argument can be a single dictionary, which is applied to
    all the tests, or an array, applied entry-by-entry.
 */
function generate_tests(func, args, properties) {
    function generate_one_test(argv) {
        return function generated_step () {
            // 'this' will be set by bind() inside test().
            func.apply(this, argv);
        };
    }

    var i;
    for (i = 0; i < args.length; i++) {
        test(generate_one_test(args[i].slice(1)),
             args[i][0],
             Array.isArray(properties) ? properties[i] : properties);
    }
}
expose(generate_tests, 'generate_tests');

/** Set up the test harness.  Does nothing if called after any test has
    begun execution.  May be called as setup(func), setup(properties), or
    setup(func, properties).  |func| is a function to call synchronously;
    if it throws an exception the entire test group is considered failed.
    |properties| is a dictionary containing one or more of these keys:

    explicit_done - Wait for an explicit call to done() before
        declaring all tests complete (see below; implicitly true for
        single-test files)

    allow_uncaught_exception - Don't treat an uncaught exception from
        non-test code as an error.  (Exceptions thrown out of test
        functions are still errors.)

    timeout - Global timeout in milliseconds (default: 5 seconds)
    test_timeout - Per-test timeout in milliseconds, unless overridden
        by the timeout property on a specific test (default: none)
 */
function setup(func_or_properties, maybe_properties) {
    var func = null,
        properties = {};

    if (arguments.length === 2) {
        func = func_or_properties;
        properties = maybe_properties;
    } else if (typeof func_or_properties === "function") {
        func = func_or_properties;
    } else {
        properties = func_or_properties;
    }
    tests.setup(func, properties);
}
expose(setup, 'setup');

/** Signal that all tests are complete.  Must be called explicitly if
    setup({explicit_done: true}) was used; otherwise implicitly
    happens when all individual tests are done. */
function done() {
    tests.end_wait();
}
expose(done, 'done');


/** Public API: Assertions.
 *  All assertion functions take a |description| argument which is used to
 *  annotate any failing tests.
 */

/** Assert that |actual| is strictly true. */
function assert_is_true(actual, description) {
    assert(actual === true, "assert_is_true", description,
           "expected true got ${actual}", {actual: actual});
}
expose(assert_is_true, 'assert_is_true');

/** Assert that |actual| is strictly false. */
function assert_is_false(actual, description) {
    assert(actual === false, "assert_is_false", description,
           "expected false got ${actual}", {actual: actual});
}
expose(assert_is_false, 'assert_is_false');

/** Assert that |actual| is strictly equal to |expected|.
    The test is even more stringent than === (see same_value, below). */
function assert_equals(actual, expected, description) {
    if (typeof actual !== typeof expected) {
        assert(false, "assert_equals", description,
               "expected (${expectedT}) ${expected} " +
               "but got (${actualT}) ${actual}",
               {expectedT: typeof expected,
                expected:  expected,
                actualT:   typeof actual,
                actual:    actual});
    }
    assert(same_value(actual, expected), "assert_equals", description,
           "expected ${expected} but got ${actual}",
           {expected: expected, actual: actual});
}
expose(assert_equals, 'assert_equals');

/** Assert that |actual| is not strictly equal to |expected|, using the
    same extra-stringent criterion as for assert_equals. */
function assert_not_equals(actual, expected, description) {
    if (typeof actual !== typeof expected) {
        return;
    }
    assert(!same_value(actual, expected), "assert_not_equals", description,
           "got disallowed value ${actual}",
           {actual: actual});
}
expose(assert_not_equals, 'assert_not_equals');

/** Assert that |expected|, a duck-typed array, contains |actual|,
    according to indexOf.  */
function assert_in_array(actual, expected, description) {
    assert(expected.indexOf(actual) !== -1, "assert_in_array", description,
           "value ${actual} not in array ${expected}",
           {actual: actual, expected: expected});
}
expose(assert_in_array, 'assert_in_array');

/** Assert that |expected| and |actual| have all the same properties,
    which are, recursively, strictly equal.  For primitive types this
    is the same as |assert_equals|.
 */
function assert_deep_equals(actual, expected, description) {
    var stack = [];
    function check_equal_r(act, exp) {
        if (is_primitive_value(exp) || is_primitive_value(act)) {
            assert(same_value(act, exp),
                   "assert_deep_equals", description,
                   "expected ${exp} but got ${act}" +
                   " (top level: expected ${expected} but got ${actual})",
                   {exp: exp, act: act, expected: expected, actual: actual});

        } else if (stack.indexOf(act) === -1) {
            var ka = {}, ke = {}, k;
            stack.push(act);

            Object.getOwnPropertyNames(actual).forEach(function (x) {
                ka[x] = true;
            });
            Object.getOwnPropertyNames(expected).forEach(function (x) {
                ke[x] = true;
            });

            for (k in ke) {
                assert(k in ka,
                       "assert_deep_equals", description,
                       "expected property ${k} missing" +
                       " (top level: expected ${expected} but got ${actual})",
                       {k: k, expected: expected, actual: actual});

                check_equal_r(act[k], exp[k]);
                delete ka[k];
            }
            for (k in ka) {
                assert(false, "assert_deep_equals", description,
                       "unexpected property ${k}" +
                       " (top level: expected ${expected} but got ${actual})",
                       {k: k, expected: expected, actual: actual});
            }

            stack.pop();
        }
    }
    check_equal_r(actual, expected);
}
expose(assert_deep_equals, 'assert_deep_equals');

/** Assert that |expected| and |actual|, both primitive numbers, are
    within |epsilon| of each other. */
function assert_approx_equals(actual, expected, epsilon, description) {
    assert(typeof actual === "number",
           "assert_approx_equals", description,
           "expected a number but got a ${type_actual}",
           {type_actual: typeof actual});
    assert(typeof expected === "number",
           "assert_approx_equals", description,
           "expectation should be a number, got a ${type_expected}",
           {type_expected: typeof expected});
    assert(typeof epsilon === "number",
           "assert_approx_equals", description,
           "epsilon should be a number but got a ${type_epsilon}",
           {type_epsilon: typeof epsilon});

    assert(Math.abs(actual - expected) <= epsilon,
           "assert_approx_equals", description,
           "expected ${expected} +/- ${epsilon} but got ${actual}",
           {expected: expected, actual: actual, epsilon: epsilon});
}
expose(assert_approx_equals, 'assert_approx_equals');

/** Assert that |actual| is less than |expected|, where both are
    primitive numbers. */
function assert_less_than(actual, expected, description) {
    assert(typeof actual === "number",
           "assert_less_than", description,
           "expected a number but got a ${type_actual}",
           {type_actual: typeof actual});
    assert(typeof expected === "number",
           "assert_approx_equals", description,
           "expectation should be a number, got a ${type_expected}",
           {type_expected: typeof expected});

    assert(actual < expected,
           "assert_less_than", description,
           "expected a number less than ${expected} but got ${actual}",
           {expected: expected, actual: actual});
}
expose(assert_less_than, 'assert_less_than');

/** Assert that |actual| is greater than |expected|, where both are
    primitive numbers. */
function assert_greater_than(actual, expected, description) {
    assert(typeof actual === "number",
           "assert_greater_than", description,
           "expected a number but got a ${type_actual}",
           {type_actual: typeof actual});
    assert(typeof expected === "number",
           "assert_approx_equals", description,
           "expectation should be a number, got a ${type_expected}",
           {type_expected: typeof expected});

    assert(actual > expected,
           "assert_greater_than", description,
           "expected a number greater than ${expected} but got ${actual}",
           {expected: expected, actual: actual});
}
expose(assert_greater_than, 'assert_greater_than');

/** Assert that |actual| is less than or equal to |expected|, where
    both are primitive numbers. */
function assert_less_than_equal(actual, expected, description) {
    assert(typeof actual === "number",
           "assert_less_than_equal", description,
           "expected a number but got a ${type_actual}",
           {type_actual: typeof actual});
    assert(typeof expected === "number",
           "assert_approx_equals", description,
           "expectation should be a number, got a ${type_expected}",
           {type_expected: typeof expected});

    assert(actual <= expected,
           "assert_less_than", description,
           "expected a number less than or equal to ${expected} "+
           "but got ${actual}",
           {expected: expected, actual: actual});
}
expose(assert_less_than_equal, 'assert_less_than_equal');

/** Assert that |actual| is greater than or equal to |expected|, where
    both are primitive numbers. */
function assert_greater_than_equal(actual, expected, description) {
    assert(typeof actual === "number",
           "assert_greater_than_equal", description,
           "expected a number but got a ${type_actual}",
           {type_actual: typeof actual});
    assert(typeof expected === "number",
           "assert_approx_equals", description,
           "expectation should be a number, got a ${type_expected}",
           {type_expected: typeof expected});

    assert(actual >= expected,
           "assert_greater_than_equal", description,
           "expected a number greater than or equal to ${expected} "+
           "but got ${actual}",
           {expected: expected, actual: actual});
}
expose(assert_greater_than_equal, 'assert_greater_than_equal');

/** Assert that |actual|, a string, matches a regexp, |expected|. */
function assert_regexp_match(actual, expected, description) {
    assert(expected.test(actual),
           "assert_regexp_match", description,
           "expected ${actual} to match ${expected}",
           {expected: expected, actual: actual});
}
expose(assert_regexp_match, 'assert_regexp_match');

/** Assert that |actual|, a string, does _not_ match a regexp, |expected|. */
function assert_regexp_not_match(actual, expected, description) {
    assert(!expected.test(actual),
           "assert_regexp_not_match", description,
           "expected ${actual} not to match ${expected}",
           {expected: expected, actual: actual});
}
expose(assert_regexp_not_match, 'assert_regexp_not_match');

/** Assert that |typeof object| is strictly equal to |type|. */
function assert_type_of(object, type, description) {
    assert(typeof object === type,
           "assert_type_of", description,
           "expected typeof ${object} to be ${expected}, got ${actual}",
           {object: object, expected: type, actual: typeof object});
}
expose(assert_type_of, 'assert_type_of');

/** Assert that |object instanceof type|. */
function assert_instance_of(object, type, description) {
    assert(object instanceof type,
           "assert_instance_of", description,
           "expected ${object} to be instanceof ${expected}",
           {object: object, expected: type});
}
expose(assert_instance_of, 'assert_instance_of');

/** Assert that |object| has the class string |expected|.  */
function assert_class_string(object, expected, description) {
    var actual = ({}).toString.call(object).slice(8, -1);
    assert(actual === expected,
           "assert_class_string", description,
           "expected ${object} to have class string ${expected}, "+
           "but got ${actual}",
           {object: object, expected: expected, actual: actual});
}
expose(assert_class_string, 'assert_class_string');

/** Assert that |object| has a property named |name|. */
function assert_own_property(object, name, description) {
    assert(typeof object === "object",
           "assert_own_property", description,
           "provided value is not an object");

    assert("hasOwnProperty" in object,
           "assert_own_property", description,
           "provided value is an object but has no hasOwnProperty method");

    assert(object.hasOwnProperty(name),
           "assert_own_property", description,
           "expected property ${name} missing", {name: name});
}
expose(assert_own_property, 'assert_own_property');

/** Assert that |object| inherits a property named |name|.
    Note: this assertion will fail for objects that have an
    own-property named |name|. */
function assert_inherits(object, name, description) {
    assert(typeof object === "object",
           "assert_inherits", description,
           "provided value is not an object");

    assert("hasOwnProperty" in object,
           "assert_inherits", description,
           "provided value is an object but has no hasOwnProperty method");

    assert(!object.hasOwnProperty(name),
           "assert_inherits", description,
           "property ${p} found on object, expected only in prototype chain",
           {p: name});

    assert(name in object,
           "assert_inherits", description,
           "property ${p} not found in prototype chain",
           {p: name});

}
expose(assert_inherits, 'assert_inherits');

/** Assert that |object| neither has nor inherits a property named |name|. */
function assert_no_property(object, name, description) {
    assert(typeof object === "object",
           "assert_no_property", description,
           "provided value is not an object");

    assert("hasOwnProperty" in object,
           "assert_no_property", description,
           "provided value is an object but has no hasOwnProperty method");

    assert(!object.hasOwnProperty(name),
           "assert_no_property", description,
           "property ${p} found on object, expected to be absent",
           {p: name});

    assert(!(name in object),
           "assert_no_property", description,
           "property ${p} found in prototype chain, expected to be absent",
           {p: name});
}
expose(assert_no_property, 'assert_no_property');

/** Assert that property |name| of |object| is read-only according
    to its property descriptor.  */
function assert_readonly(object, name, description) {
    var o = {}, desc;

    assert('getOwnPropertyDescriptor' in o,
           "assert_readonly", description,
           "Object.getOwnPropertyDescriptor is missing");

    assert(object.hasOwnProperty(name),
           "assert_readonly", description,
           "expected property ${name} missing", {name: name});

    desc = o.getOwnPropertyDescriptor.call(object, name);
    if ('writable' in desc) {
        assert(!desc.writable, "assert_readonly", description,
               "data property ${name} is writable (expected read-only)",
               {name: name});
    } else {
        assert('get' in desc && 'set' in desc,
               "assert_readonly", description,
               "unrecognized type of property descriptor "+
               "for ${name}: ${desc}",
               {name: name, desc: desc});
        assert(desc.set === undefined,
               "assert_readonly", description,
               "property ${name} has a setter (expected read-only)",
               {name: name, desc: desc});
    }
}
expose(assert_readonly, 'assert_readonly');

/** Assert that |func| throws an exception described by |code|.
    |func| is called with no arguments and no |this| -- use bind() if
    that's a problem.  |code| can take one of two forms:

    string - the thrown exception must be a DOMException with the
             given name, e.g., "TimeoutError", or else it must
             stringify to this string.

    object - must have one or more of the properties "code", "name",
             and "message".  Whichever properties are present must
             match the corresponding properties of the thrown
             exception.  As a special case, "message" will also match
             the stringification of the exception.
*/

function assert_throws(code, func, description) {
    var name_code_map = {
        IndexSizeError: 1,
        HierarchyRequestError: 3,
        WrongDocumentError: 4,
        InvalidCharacterError: 5,
        NoModificationAllowedError: 7,
        NotFoundError: 8,
        NotSupportedError: 9,
        InvalidStateError: 11,
        SyntaxError: 12,
        InvalidModificationError: 13,
        NamespaceError: 14,
        InvalidAccessError: 15,
        TypeMismatchError: 17,
        SecurityError: 18,
        NetworkError: 19,
        AbortError: 20,
        URLMismatchError: 21,
        QuotaExceededError: 22,
        TimeoutError: 23,
        InvalidNodeTypeError: 24,
        DataCloneError: 25,

        UnknownError: 0,
        ConstraintError: 0,
        DataError: 0,
        TransactionInactiveError: 0,
        ReadOnlyError: 0,
        VersionError: 0
    };

    if (typeof code === "object") {
        assert("name" in code || "code" in code || "message" in code,
               "assert_throws", description,
               "exception spec ${code} has no 'name', 'code', or 'message'" +
               "properties",
               {code: code});
    } else if (name_code_map.hasOwnProperty(code)) {
        code = { name: code,
                 code: name_code_map[code] };
    } else {
        code = { message: code.toString() };
    }

    try {
        func();
        assert(false, "assert_throws", description,
               "${func} did not throw", {func: func});
    } catch (e) {
        if (e instanceof AssertionError) {
            throw e;
        }

        // Backward compatibility wart for DOMExceptions identified
        // only by numeric code.
        if ("code" in code && code.code !== 0 &&
            (!("name" in e) || e.name === e.name.toUpperCase() ||
             e.name === "DOMException"))
            delete code.name;

        if ("name" in code) {
            assert("name" in e && e.name === code.name,
                   "assert_throws", description,
                   "${func} threw ${actual} (${actual_name}), "+
                   "expected ${expected} (${expected_name})",
                   {func: func, actual: e, actual_name: e.name,
                    expected: code,
                    expected_name: code.name});
        }
        if ("code" in code) {
            assert("code" in e && e.code === code.code,
                   "assert_throws", description,
                   "${func} threw ${actual} (${actual_code}), "+
                   "expected ${expected} (${expected_code})",
                   {func: func, actual: e, actual_code: e.code,
                    expected: code,
                    expected_code: code.code});
        }
        if ("message" in code) {
            if (Object.hasOwnProperty.call(e, "message")) {
                assert(e.message === code.message,
                       "assert_throws", description,
                       "${func} threw ${actual} (${actual_message}), "+
                       "expected ${expected} (${expected_message})",
                       {func: func, actual: e, actual_message: e.message,
                        expected: code, expected_message: code.message});
            } else {
                // Intentional use of loose equality
                assert(e == code.message,
                       "assert_throws", description,
                       "${func} threw ${actual}, expected ${expected})",
                       {func: func, actual: e, expected: code.message});
            }
        }
    }
}
expose(assert_throws, 'assert_throws');

/** Assert that control flow cannot reach the point where this
    assertion appears.  */
function assert_unreached(description) {
    assert(false, "assert_unreached", description,
           "reached unreachable code");
}
expose(assert_unreached, 'assert_unreached');

/** Test object.
 *  These must be created by calling test() or async_test(), but
 *  many of their methods are part of the public API.
 */

function Test(name, properties) {
    this.name              = name;
    this.phase             = Test.phases.INITIAL;
    this.in_done           = false;
    this.status            = Test.NOTRUN;
    this.timeout_id        = null;
    this.message           = null;
    this.steps             = [];
    this.cleanup_callbacks = [];

    if (!properties) {
        properties = {};
    }
    this.properties = properties;
    this.timeout_length = properties.timeout ? properties.timeout
                                             : tests.test_timeout_length;
    this.should_run = !properties.skip;
    tests.push(this);
    this.number = tests.tests.length;

    if (!this.should_run) {
        // Fake initial step that _does_ run, but short-circuits the test.
        // All other steps will be marked not to be run via the defaults
        // in step().  The step function does not call done() because that
        // would record a success.  We can't do this ourselves because the
        // plan line has not been emitted yet.
        var stepdata = this.step(function () {
            this.phase = Test.phases.COMPLETE;
            tests.result(this);
        });
        stepdata.should_run = true;
        stepdata.auto_run = true;
    }
}

Test.phases = {
    INITIAL:    0,
    STARTED:    1,
    HAS_RESULT: 2,
    COMPLETE:   3
};
Test.statuses = {
    NOTRUN: -1,
    PASS:    0,
    FAIL:    1,
    XFAIL:   4,
    XPASS:   5
};
Test.prototype.phases = Test.phases;
Test.prototype.statuses = Test.phases;

(function() {
    var x;
    var o = Test.statuses;
    for (x in o) {
        if (o.hasOwnProperty(x)) {
            Test[x] = Test.statuses[x];
            Test.prototype[x] = Test.statuses[x];
        }
    }
})();

/** Queue one step of a test.  |func| will eventually be called, with
    |this| set to |this_obj|, or to the Test object if |this_obj| is
    absent.  Any further arguments will be passed down to |func|.  It
    should carry out some tests using assert_* and eventually return.
    |func| will _not_ be called if a previous step of the test has
    already failed.

    Returns an object which can be passed to this.perform_step() to
    cause |func| actually to be called -- but you should not do this
    yourself unless absolutely unavoidable.
 */
Test.prototype.step = function step(func, this_obj) {
    if (this_obj == null) {
        this_obj = this;
    }
    func = func.bind(this_obj, ...Array.prototype.slice.call(arguments, 2));

    var stepdata = {
        func: func,
        should_run: this.should_run,
        auto_run: this.should_run,
        has_run: false
    };

    this.steps.push(stepdata);
    return stepdata;
};

/** Internal: perform one step of a test.
 */
Test.prototype.perform_step = function perform_step(stepdata) {
    var message;

    if (this.phase > this.phases.STARTED ||
        tests.phase > tests.phases.HAVE_RESULTS) {
        return undefined;
    }

    this.phase = this.phases.STARTED;
    tests.started = true;
    stepdata.has_run = true;

    // Arm the local timeout if it hasn't happened already.
    if (this.timeout_id === null && this.timeout_length !== null) {
        this.timeout_id = setTimeout(this.force_timeout.bind(this),
                                     this.timeout_length);
    }

    var rv = undefined;
    try {
        rv = stepdata.func();
    } catch (e) {
        this.fail(format_exception(e));
    }
    return rv;
};

/** Mark this test as failed. */
Test.prototype.fail = function fail(message) {
    if (this.phase < this.phases.HAS_RESULT) {
        this.message = message;
        this.status = this.FAIL;
        this.phase = this.phases.HAS_RESULT;
        if (!this.in_done) {
            this.done();
        }
    } else {
        tests.output.error(message);
    }
};

/** Mark this test as completed. */
Test.prototype.done = function done() {
    var i;

    this.in_done = true;

    if (this.timeout_id !== null) {
        clearTimeout(this.timeout_id);
        this.timeout_id = null;
    }

    if (this.phase == this.phases.COMPLETE) {
        return;
    }

    // Cleanups run in reverse order (most recently added first).
    for (i = this.cleanup_callbacks.length - 1; i >= 0; i--) {
        try {
            this.cleanup_callbacks[i].call(this);
        } catch (e) {
            this.fail("In cleanup: " + format_exception(e));
        }
    }

    // If any step of the test was not run (except those that are not
    // _supposed_ to run), and no previous error was detected, that is
    // an error.
    if (this.phase < this.phases.HAS_RESULT) {
        for (i = 0; i < this.steps.length; i++) {
            if (this.steps[i].should_run && !this.steps[i].has_run) {
                this.fail("Step "+i+" was not run");
            } else if (!this.steps[i].should_run && this.steps[i].has_run) {
                this.fail("Step "+i+" should not have run");
            }
        }
    }

    if (this.phase == this.phases.STARTED) {
        this.message = null;
        this.status = this.PASS;
    }

    if (this.properties.expected_fail) {
        if (this.status === this.PASS) {
            this.status = this.XPASS;
        } else if (this.status === this.FAIL) {
            this.status = this.XFAIL;
        }
    }

    this.phase = this.phases.COMPLETE;

    tests.result(this);

};

/** Register |func| as a step function, and return a function that
    will run |func|'s step when called.  The arguments to |func| are
    whatever the arguments to the callback were, and |this| is
    |this_obj|, which defaults to the Test object.  Useful as an event
    handler, for instance. */
Test.prototype.step_func = function(func, this_obj) {
    var test_this = this;
    var cb_args = [];
    if (arguments.length === 1) {
        this_obj = test_this;
    }

    // The function returned stashes its arguments in |cb_args|, then
    // the registered step function uses them to call |func| with the
    // appropriate arguments. We have to do it this way because
    // perform_step() doesn't forward its arguments.
    var stepdata = this.step(function cb_step () {
        return func.apply(this_obj, cb_args);
    });

    stepdata.auto_run = false;
    return function() {
        cb_args = Array.prototype.slice.call(arguments);
        return test_this.perform_step(stepdata);
    };
};

/** As |step_func|, but the step calls this.done() after |func|
    returns (regardless of what it returns).  |func| may be omitted,
    in which case the step just calls this.done().  */
Test.prototype.step_func_done = function(func, this_obj) {
    var test_this = this;
    var cb_args = [];

    if (arguments.length <= 1) {
        this_obj = test_this;
    }
    if (!func) {
        func = function () {};
    }

    // The function returned stashes its arguments in |cb_args|, then
    // the registered step function uses them to call |func| with the
    // appropriate arguments. We have to do it this way because
    // perform_step() doesn't forward its arguments.
    var stepdata = this.step(function cb_done_step () {
        var rv = func.apply(this_obj, cb_args);
        test_this.done();
        return rv;
    });

    stepdata.auto_run = false;
    return function() {
        cb_args = Array.prototype.slice.call(arguments);
        return test_this.perform_step(stepdata);
    };
};

/** Returns a function that, if called, will call assert_unreached()
    inside a perform_step() invocation.  Use to set event handlers for
    events that should _not_ happen. */
Test.prototype.unreached_func = function unreached_func(description) {
    var test_this = this;
    var stepdata = this.step(function unreached_step () {
        assert_unreached(description);
    });
    stepdata.should_run = false;
    stepdata.auto_run = false;

    return function() { test_this.perform_step(stepdata); };
};

/** Register |callback| to be called once this test is done. */
Test.prototype.add_cleanup = function add_cleanup(callback) {
    this.cleanup_callbacks.push(callback);
};

/** Treat this test as having timed out. */
Test.prototype.force_timeout = function force_timeout() {
    this.message = "Test timed out";
    this.status = this.FAIL;
    this.phase = this.phases.HAS_RESULT;
    this.done();
};


/*
 * Private implementation logic begins at this point.
 */

/*
 * The Tests object is responsible for tracking the complete set of
 * tests in this file.
 */

function Tests(output) {
    this.tests = [];
    this.num_pending = 0;

    this.all_loaded = false;
    this.wait_for_finish = false;
    this.allow_uncaught_exception = false;

    this.test_timeout_length = settings.test_timeout;
    this.harness_timeout_length = settings.harness_timeout;
    this.timeout_id = null;

    this.properties = {};
    this.phase = Test.phases.INITIAL;
    this.output = output;

    var this_obj = this;
    phantom.onError = function (message, stack) {
        if (!tests.allow_uncaught_exception) {
            this_obj.output.error(message);
        }
        if (this_obj.all_done()) {
            this_obj.complete();
        }
    };
    phantom.page.onConsoleMessage = function (message) {
        if (!tests.allow_uncaught_exception) {
            this_obj.output.error("stray console message: " + message);
        }
    };
    this.set_timeout();
}

Tests.phases = {
    INITIAL:      0,
    SETUP:        1,
    HAVE_TESTS:   2,
    HAVE_RESULTS: 3,
    ABANDONED:    4,
    COMPLETE:     5
};
Tests.prototype.phases = Tests.phases;

Tests.prototype.setup = function setup(func, properties) {
    if (this.phase >= this.phases.HAVE_RESULTS) {
        return;
    }

    if (this.phase < this.phases.SETUP) {
        this.phase = this.phases.SETUP;
    }

    this.properties = properties;

    for (var p in properties) {
        if (properties.hasOwnProperty(p)) {
            var value = properties[p];
            if (p == "allow_uncaught_exception") {
                this.allow_uncaught_exception = value;
            } else if (p == "explicit_done" && value) {
                this.wait_for_finish = true;
            } else if (p == "timeout" && value) {
                this.harness_timeout_length = value;
            } else if (p == "test_timeout") {
                this.test_timeout_length = value;
            }
        }
    }
    this.set_timeout();

    if (func) {
        try {
            func();
        } catch (e) {
            this.output.error(e);
            this.phase = this.phases.ABANDONED;
        }
    }
};

Tests.prototype.set_timeout = function set_timeout() {
    var this_obj = this;
    clearTimeout(this.timeout_id);
    if (this.harness_timeout_length !== null) {
        this.timeout_id = setTimeout(function () { this_obj.timeout(); },
                                     this.harness_timeout_length);
    }
};

Tests.prototype.timeout = function timeout() {
    this.output.error("Global timeout expired");
    for (var i = 0; i < tests.tests.length; i++) {
        var t = tests.tests[i];
        if (t.phase < Test.phases.HAS_RESULT) {
            t.force_timeout();
        }
    }
    this.complete();
};

Tests.prototype.end_wait = function end_wait() {
    this.wait_for_finish = false;
    if (this.all_done()) {
        this.complete();
    }
};

Tests.prototype.push = function push(test)
{
    if (this.phase < this.phases.HAVE_TESTS) {
        this.phase = this.phases.HAVE_TESTS;
    }
    this.num_pending++;
    this.tests.push(test);
};

Tests.prototype.all_done = function all_done() {
    return (this.tests.length > 0 &&
            this.all_loaded &&
            this.num_pending === 0 &&
            !this.wait_for_finish);
};

Tests.prototype.result = function result(test) {
    if (this.phase < this.phases.HAVE_RESULTS) {
        this.phase = this.phases.HAVE_RESULTS;
    }
    this.num_pending--;
    this.output.result(test);
    if (this.all_done()) {
        this.complete();
    } else {
        setTimeout(this.run_tests.bind(this), 0);
    }
};

Tests.prototype.run_tests = function run_tests() {
    if (this.phase >= this.phases.COMPLETE) {
        return;
    }
    if (this.all_done() || this.phase >= this.phases.ABANDONED) {
        this.complete();
        return;
    }
    for (var i = 0; i < this.tests.length; i++) {
        var t = this.tests[i];
        if (t.phase < t.phases.STARTED && t.steps.length > 0) {
            for (var j = 0; j < t.steps.length; j++) {
                if (t.steps[j].auto_run) {
                    t.perform_step(t.steps[j]);
                }
            }
            // We will come back here via the setTimeout in
            // Tests.prototype.result.
            break;
        }
    }
};

Tests.prototype.begin = function begin() {
    this.all_loaded = true;
    this.output.begin(this.tests.length, this.phase);
    this.run_tests();
    if (this.all_done()) {
        this.complete();
    }
};

Tests.prototype.complete = function complete() {
    var i, x;

    if (this.phase === this.phases.COMPLETE) {
        return;
    }
    for (i = 0; i < this.tests.length; i++) {
        this.tests[i].done();
    }

    this.phase = this.phases.COMPLETE;
    this.output.complete(this);
};

/*
 * The Output object is responsible for reporting the status of each
 * test.  For PhantomJS, output is much simpler than for the W3C
 * harness; we basically just log things to the console as
 * appropriate.  The output format is meant to be compatible with
 * TAP (http://testanything.org/tap-specification.html).
 */

function Output(fp, verbose) {
    this.fp = fp;
    this.verbose = verbose;
    this.failed = false;
}

Output.prototype.begin = function begin(n, phase) {
    if (phase === Tests.phases.ABANDONED) {
        this.fp.write("1..0 # SKIP: setup failed\n");
    } else {
        this.fp.write("1.." + n + "\n");
    }
};

Output.prototype.diagnostic = function diagnostic(message, is_info) {
    var fp     = this.fp;
    var prefix = "# ";
    if (is_info) {
        prefix = "## ";
    }
    message.split("\n").forEach(function (line) {
        fp.write(prefix + line + "\n");
    });
};

Output.prototype.error = function error(message) {
    this.diagnostic("ERROR: " + message);
    this.failed = true;
};

Output.prototype.info = function info(message) {
    this.diagnostic(message, true);
};

Output.prototype.result = function result(test) {
    if (test.message) {
        this.diagnostic(test.message);
    }
    var prefix, directive = "";
    switch (test.status) {
    case Test.PASS:   prefix =     "ok "; break;
    case Test.FAIL:   prefix = "not ok "; break;
    case Test.XPASS:  prefix =     "ok "; directive = " # TODO"; break;
    case Test.XFAIL:  prefix = "not ok "; directive = " # TODO"; break;
    case Test.NOTRUN: prefix =     "ok "; directive = " # SKIP"; break;
    default:
        this.error("Unrecognized test status " + test.status);
        prefix = "not ok ";
    }
    if ((prefix === "not ok " && directive !== " # TODO") ||
        (prefix === "ok "     && directive === " # TODO")) {
        this.failed = true;
    }
    this.fp.write(prefix + test.number + " " + test.name + directive + "\n");
};

Output.prototype.complete = function complete(tests) {
    phantom.exit(this.failed ? 1 : 0);
};

/*
 * Utilities.
 */

function expose(fn, name) {
    window[name] = fn;
}

/** This function is not part of the public API, but its
    *behavior* is part of the contract of several assert_* functions. */
function same_value(x, y) {
    if (x === y) {
        // Distinguish +0 and -0
        if (x === 0 && y === 0) {
            return 1/x === 1/y;
        }
        return true;
    } else {
        // NaN !== _everything_, including another NaN.
        // Make it same_value as itself.
        if (x !== x) {
            return y !== y;
        }
        // Compare Date and RegExp by value.
        if (x instanceof Date) {
            return y instanceof Date && x.getTime() === y.getTime();
        }
        if (x instanceof RegExp) {
            return y instanceof RegExp && x.toString() === y.toString();
        }
        return false;
    }
}

/** Similarly, this function's behavior is part of the contract of
    assert_deep_equals. (These are the things for which it will just
    call same_value rather than doing a recursive property comparison.)  */
function is_primitive_value(val) {
    return (val === undefined || val === null || typeof val !== 'object' ||
            val instanceof Date || val instanceof RegExp);
}

var names_used = {};
function test_name(func, name) {
    var n, c;

    if (name)
        ;
    else if (func && func.displayName)
        name = func.displayName;
    else if (func && func.name)
        name = func.name;
    else
        name = "test";

    n = name;
    c = 0;
    while (n in names_used) {
        n = name + "." + c.toString();
        c += 1;
    }
    return n;
}

function AssertionError(message) {
    this.message = message;
}

AssertionError.prototype.toString = function toString() {
    return this.message;
};

function assert(expected_true, name, description, error, substitutions) {
    if (expected_true !== true) {
        throw new AssertionError(make_message(
            name, description, error, substitutions));
    } else if (output.verbose >= 4) {
        output.info(make_message(name, description, error, substitutions));
    }
}

function make_message(function_name, description, error, substitutions) {
    var p, message;

    for (p in substitutions) {
        if (substitutions.hasOwnProperty(p)) {
            substitutions[p] = format_value(substitutions[p]);
        }
    }

    if (description) {
        description += ": ";
    } else {
        description = "";
    }

    return (function_name + ": " + description +
            error.replace(/\$\{[^}]+\}/g, function (match) {
                return substitutions[match.slice(2,-1)];
            }));
}

function format_value(val, seen) {
    if (seen === undefined)
        seen = [];

    var s;
    function truncate(s, len) {
        if (s.length > len) {
            return s.slice(-3) + "...";
        }
        return s;
    }

    switch (typeof val) {
    case "number":
        // In JavaScript, -0 === 0 and String(-0) == "0", so we have to
        // special-case.
        if (val === -0 && 1/val === -Infinity) {
            return "-0";
        }
        // falls through
    case "boolean":
    case "undefined":
        return String(val);

    case "string":
        // Escape ", \, all C0 and C1 control characters, and
        // Unicode's LINE SEPARATOR and PARAGRAPH SEPARATOR.
        // The latter two are the only characters above U+009F
        // that may not appear verbatim in a JS string constant.
        val = val.replace(/["\\\u0000-\u001f\u007f-\u009f\u2028\u2029]/g,
                          function (c) {
                              switch (c) {
                                  case "\b": return "\\b";
                                  case "\f": return "\\f";
                                  case "\n": return "\\n";
                                  case "\r": return "\\r";
                                  case "\t": return "\\t";
                                  case "\v": return "\\v";
                                  case "\\": return "\\\\";
                                  case "\"": return "\\\"";
                                  default:
                                  // We know by construction that c is
                                  // a single BMP character.
                                  c = c.charCodeAt(0);
                                  if (c < 0x0080) {
                                      return "\\x" +
                                          ("00" + c.toString(16)).slice(-2);
                                  } else {
                                      return "\\u" +
                                          ("0000" + c.toString(16)).slice(-4);
                                  }
                              }
                          });
        return '"' + val + '"';

    case "object":
        if (val === null) {
            return "null";
        }
        if (seen.indexOf(val) >= 0) {
            return "<cycle>";
        }
        seen.push(val);

        if (Array.isArray(val)) {
            return "[" + val.map(function (x) {
                return format_value(x, seen);
            }).join(", ") + "]";
        }

        s = String(val);
        if (s != "[object Object]") {
            return truncate(s, 60);
        }
        return "{ " + Object.keys(val).map(function (k) {
            return format_value(k, seen) + ": " + format_value(val[k], seen);
        }).join(", ") + "}";

    default:
        return typeof val + ' "' + truncate(String(val), 60) + '"';
    }
}

function format_exception (e) {
    var message = (typeof e === "object" && e !== null) ? e.message : e;
    if (typeof e.stack != "undefined" && typeof e.message == "string") {
        // Prune the stack.  This knows the format of WebKit's stack traces.
        var stack = e.stack.split("\n");
        var lo, hi;
        // We do not need to hear about initial lines naming the
        // assertion function.
        for (lo = 0; lo < stack.length; lo++) {
            if (!/^assert(?:_[a-z0-9_]+)?@.*?testharness\.js:/
                .test(stack[lo])) {
                break;
            }
        }
        // We do not need to hear about how we got _to_ the test function.
        // The caller of the test function is guaranteed to have "_step" in
        // its name.
        for (hi = lo; hi < stack.length; hi++) {
            if (/^[a-z_]+_step.*?testharness\.js:/.test(stack[hi])) {
                break;
            }
        }
        if (lo < stack.length && lo < hi) {
            stack = stack.slice(lo, hi);
        }
        message += "\n";
        message += stack.join("\n");
    }
    return message;
}

function process_command_line(sys) {
    function usage(error) {
        sys.stderr.write("error: " + error + "\n");
        sys.stderr.write("usage: " + sys.args[0] +
                         " [--verbose=N] test_script.js ...\n");
    }
    var args = { verbose: -1,
                 test_script: "" };

    for (var i = 1; i < sys.args.length; i++) {
        if (sys.args[i].length === 0) {
            usage("empty argument is not meaningful");
            return args;
        }
        if (sys.args[i][0] !== '-') {
            args.test_script = sys.args[i];
            break;
        }
        var n = "--verbose=".length;
        var v = sys.args[i].slice(0, n);
        var a = sys.args[i].slice(n);
        if (v === "--verbose=" && /^[0-9]+$/.test(a)) {
            if (args.verbose === -1) {
                args.verbose = parseInt(a, 10);
                continue;
            } else {
                usage("--verbose specified twice");
                return args;
            }
        }
        usage("unrecognized option " + format_value(sys.args[i]));
        return args;
    }

    if (args.test_script === "") {
        usage("no test script specified");
        return args;
    }

    if (args.verbose === -1) {
        args.verbose = 0;
    }

    return args;
}

/*
 * Global state
 */

var settings = {
    harness_timeout: 5000,
    test_timeout: null
};

var sys  = require('system');
var fs   = require('fs');
var args = process_command_line(sys);

if (args.test_script === "") {
    // process_command_line has already issued an error message.
    phantom.exit(2);
} else {
    // Reset the library paths for injectJs and require to the
    // directory containing the test script, so relative imports work
    // as expected.  Unfortunately, phantom.libraryPath is not a
    // proper search path -- it can only hold one directory at a time.
    // require.paths has no such limitation.
    var test_script = fs.absolute(args.test_script);
    phantom.libraryPath = test_script.slice(0,
        test_script.lastIndexOf(fs.separator));
    require.paths.push(phantom.libraryPath);

    // run-tests.py sets these environment variables to the base URLs
    // of its HTTP and HTTPS servers.
    expose(sys.env['TEST_HTTP_BASE'], 'TEST_HTTP_BASE');
    expose(sys.env['TEST_HTTPS_BASE'], 'TEST_HTTPS_BASE');

    var output = new Output(sys.stdout, args.verbose);
    var tests = new Tests(output);

    // This evaluates the test script synchronously.
    // Any errors should be caught by our onError hook.
    phantom.injectJs(test_script);

    tests.begin();
}

})();
