
var fs = require('fs');

var ABSENT_DIR = "absentdir02",
    ABSENT_FILE = "absentfile02",
    TEST_DIR = "testdir02",
    TEST_FILE = "temp-02.test",
    TEST_FILE_PATH = fs.join(TEST_DIR, TEST_FILE),
    TEST_CONTENT = "test content",
    CONTENT_MULTIPLIER = 1024;

test(function () {
    assert_throws("Unable to read file '"+ ABSENT_FILE +"' size",
                  function () { fs.size(ABSENT_FILE); });

    assert_equals(fs.lastModified(ABSENT_FILE), null);

}, "size/date queries on nonexistent files", {/* unsupported */expected_fail: true});

test(function () {
    // Round down to the nearest multiple of two seconds, because
    // file timestamps might only have that much precision.
    var before_creation = Math.floor(Date.now() / 2000) * 2000;

    var f = fs.open(TEST_FILE, "w");
    this.add_cleanup(function () {
        if (f !== null) f.close();
        fs.remove(TEST_FILE);
    });

    for (var i = 0; i < CONTENT_MULTIPLIER; i++) {
        f.write(TEST_CONTENT);
    }
    f.close(); f = null;

    // Similarly, but round _up_.
    var after_creation = Math.ceil(Date.now() / 2000) * 2000;

    assert_equals(fs.size(TEST_FILE),
                  TEST_CONTENT.length * CONTENT_MULTIPLIER);

    var flm = fs.lastModified(TEST_FILE).getTime();

    assert_greater_than_equal(flm, before_creation);
    assert_less_than_equal(flm, after_creation);

}, "size/date queries on existing files");

test(function () {
    fs.makeDirectory(TEST_DIR);
    this.add_cleanup(function () { fs.removeTree(TEST_DIR); });
    fs.write(TEST_FILE_PATH, TEST_CONTENT, "w");

    assert_is_true(fs.exists(TEST_FILE_PATH));
    assert_is_true(fs.exists(TEST_DIR));
    assert_is_false(fs.exists(ABSENT_FILE));
    assert_is_false(fs.exists(ABSENT_DIR));

    assert_is_true(fs.isDirectory(TEST_DIR));
    assert_is_false(fs.isDirectory(ABSENT_DIR));


    assert_is_true(fs.isFile(TEST_FILE_PATH));
    assert_is_false(fs.isFile(ABSENT_FILE));

    var absPath = fs.absolute(TEST_FILE_PATH);
    assert_is_false(fs.isAbsolute(TEST_FILE_PATH));
    assert_is_true(fs.isAbsolute(absPath));

    assert_is_true(fs.isReadable(TEST_FILE_PATH));
    assert_is_true(fs.isWritable(TEST_FILE_PATH));
    assert_is_false(fs.isExecutable(TEST_FILE_PATH));

    assert_is_false(fs.isReadable(ABSENT_FILE));
    assert_is_false(fs.isWritable(ABSENT_FILE));
    assert_is_false(fs.isExecutable(ABSENT_FILE));

    assert_is_true(fs.isReadable(TEST_DIR));
    assert_is_true(fs.isWritable(TEST_DIR));
    assert_is_true(fs.isExecutable(TEST_DIR));

    assert_is_false(fs.isReadable(ABSENT_DIR));
    assert_is_false(fs.isWritable(ABSENT_DIR));
    assert_is_false(fs.isExecutable(ABSENT_DIR));

    assert_is_false(fs.isLink(TEST_DIR));
    assert_is_false(fs.isLink(TEST_FILE_PATH));
    assert_is_false(fs.isLink(ABSENT_DIR));
    assert_is_false(fs.isLink(ABSENT_FILE));

}, "file types and access modes");
