
var fs = require('fs');
var system = require('system');

var TEST_DIR = "testdir",
    TEST_FILE = "testfile",
    START_CWD = fs.workingDirectory;

test(function () {
    assert_is_true(fs.makeDirectory(TEST_DIR));
    this.add_cleanup(function () { fs.removeTree(TEST_DIR); });

    assert_is_true(fs.changeWorkingDirectory(TEST_DIR));
    this.add_cleanup(function () { fs.changeWorkingDirectory(START_CWD); });

    fs.write(TEST_FILE, TEST_FILE, "w");
    var suffix = fs.join("", TEST_DIR, TEST_FILE),
        abs = fs.absolute(".." + suffix),
        lastIndex = abs.lastIndexOf(suffix);

    assert_not_equals(lastIndex, -1);
    assert_equals(lastIndex + suffix.length, abs.length);

}, "manipulation of current working directory");

test(function () {

    fs.copyTree(phantom.libraryPath, TEST_DIR);
    this.add_cleanup(function () { fs.removeTree(TEST_DIR); });

    assert_deep_equals(fs.list(phantom.libraryPath), fs.list(TEST_DIR));

}, "copying a directory tree");

test(function () {
    assert_type_of(fs.readLink, 'function');
    // TODO: test the actual functionality once we can create symlinks.
}, "fs.readLink exists");

generate_tests(function fs_join_test (parts, expected) {
    var actual = fs.join.apply(null, parts);
    assert_equals(actual, expected);
}, [
    [ "fs.join: []",               [],                          "."      ],
    [ "fs.join: nonsense",         [[], null],                  "."      ],
    [ "fs.join: 1 element",        [""],                        "."      ],
    [ "fs.join: 2 elements",       ["", "a"],                   "/a"     ],
    [ "fs.join: 3 elements",       ["a", "b", "c"],             "a/b/c"  ],
    [ "fs.join: 4 elements",       ["", "a", "b", "c"],         "/a/b/c" ],
    [ "fs.join: empty elements",   ["", "a", "", "b", "", "c"], "/a/b/c" ],
    [ "fs.join: empty elements 2", ["a", "", "b", "", "c"],     "a/b/c"  ]
]);

generate_tests(function fs_split_test (input, expected) {
    var path = input.join(fs.separator);
    var actual = fs.split(path);
    assert_deep_equals(actual, expected);
}, [
    [ "fs.split: absolute",
      ["", "a", "b", "c", "d"],     ["", "a", "b", "c", "d"] ],
    [ "fs.split: absolute, trailing",
      ["", "a", "b", "c", "d", ""], ["", "a", "b", "c", "d"] ],
    [ "fs.split: non-absolute",
      ["a", "b", "c", "d"],         ["a", "b", "c", "d"] ],
    [ "fs.split: non-absolute, trailing",
      ["a", "b", "c", "d", ""],     ["a", "b", "c", "d"] ],
    [ "fs.split: repeated separators",
      ["a", "", "", "",
       "b", "",
       "c", "", "",
       "d", "", "", ""],            ["a", "b", "c", "d"] ]
]);
