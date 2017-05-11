// Basic Files API (read, write, remove, ...)

var FILENAME = "temp-01.test",
    FILENAME_COPY = FILENAME + ".copy",
    FILENAME_MOVED = FILENAME + ".moved",
    FILENAME_EMPTY = FILENAME + ".empty",
    FILENAME_ENC = FILENAME + ".enc",
    FILENAME_BIN = FILENAME + ".bin",
    ABSENT = "absent-01.test";

var fs;

setup(function () {
    fs = require('fs');
    var f = fs.open(FILENAME, "w");

    f.write("hello");
    f.writeLine("");
    f.writeLine("world");
    f.close();
});

test(function () {
    assert_is_true(fs.exists(FILENAME));
    // we might've gotten DOS line endings
    assert_greater_than_equal(fs.size(FILENAME), "hello\nworld\n".length);

}, "create a file with contents");

test(function () {
    assert_is_false(fs.exists(FILENAME_EMPTY));
    fs.touch(FILENAME_EMPTY);
    assert_is_true(fs.exists(FILENAME_EMPTY));
    assert_equals(fs.size(FILENAME_EMPTY), 0);

}, "create (touch) an empty file");

test(function () {
    var content = "";
    var f = fs.open(FILENAME, "r");
    this.add_cleanup(function () { f.close(); });

    content = f.read();
    assert_equals(content, "hello\nworld\n");

}, "read content from a file");

test(function () {
    var content = "";
    var f = fs.open(FILENAME, "r");
    this.add_cleanup(function () { f.close(); });

    f.seek(3);
    content = f.read(5);
    assert_equals(content, "lo\nwo");

}, "read specific number of bytes from a specific position in a file");

test(function () {
    var content = "";
    var f = fs.open(FILENAME, "rw+");
    this.add_cleanup(function () { f.close(); });

    f.writeLine("asdf");
    content = f.read();
    assert_equals(content, "hello\nworld\nasdf\n");

}, "append content to a file");

test(function () {
    var f = fs.open(FILENAME, "r");
    this.add_cleanup(function () { f.close(); });
    assert_equals(f.getEncoding(), "UTF-8");

}, "get the file encoding (default: UTF-8)");

test(function () {
    var f = fs.open(FILENAME, { charset: "UTF-8", mode: "r" });
    this.add_cleanup(function () { f.close(); });
    assert_equals(f.getEncoding(), "UTF-8");

    var g = fs.open(FILENAME, { charset: "SJIS", mode: "r" });
    this.add_cleanup(function () { g.close(); });
    assert_equals(g.getEncoding(), "Shift_JIS");

}, "set the encoding on open", {/* unsupported */expected_fail: true});

test(function () {
    var f = fs.open(FILENAME, { charset: "UTF-8", mode: "r" });
    this.add_cleanup(function () { f.close(); });
    assert_equals(f.getEncoding(), "UTF-8");
    f.setEncoding("utf8");
    assert_equals(f.getEncoding(), "UTF-8");

    var g = fs.open(FILENAME, { charset: "SJIS", mode: "r" });
    this.add_cleanup(function () { g.close(); });
    assert_equals(g.getEncoding(), "Shift_JIS");
    g.setEncoding("eucjp");
    assert_equals(g.getEncoding(), "EUC-JP");

}, "change the encoding using setEncoding", {/* unsupported */expected_fail: true});

test(function () {
    assert_is_false(fs.exists(FILENAME_COPY));
    fs.copy(FILENAME, FILENAME_COPY);
    assert_is_true(fs.exists(FILENAME_COPY));
    assert_equals(fs.read(FILENAME), fs.read(FILENAME_COPY));

}, "copy a file");

test(function () {
    assert_is_true(fs.exists(FILENAME));
    var contentBeforeMove = fs.read(FILENAME);
    fs.move(FILENAME, FILENAME_MOVED);
    assert_is_false(fs.exists(FILENAME));
    assert_is_true(fs.exists(FILENAME_MOVED));
    assert_equals(fs.read(FILENAME_MOVED), contentBeforeMove);

}, "move a file");

test(function () {
    assert_is_true(fs.exists(FILENAME_MOVED));
    assert_is_true(fs.exists(FILENAME_COPY));
    assert_is_true(fs.exists(FILENAME_EMPTY));

    fs.remove(FILENAME_MOVED);
    fs.remove(FILENAME_COPY);
    fs.remove(FILENAME_EMPTY);

    assert_is_false(fs.exists(FILENAME_MOVED));
    assert_is_false(fs.exists(FILENAME_COPY));
    assert_is_false(fs.exists(FILENAME_EMPTY));

}, "remove a file");

test(function () {
    assert_throws("Unable to open file '"+ ABSENT +"'",
                  function () { fs.open(ABSENT, "r"); });

    assert_throws("Unable to copy file '" + ABSENT +
                  "' at '" + FILENAME_COPY + "'",
                  function () { fs.copy(ABSENT, FILENAME_COPY); });

}, "operations on nonexistent files throw an exception", {/* unsupported */expected_fail: true});

test(function () {
    var data   = "ÄABCÖ";
    var data_b = String.fromCharCode(
        0xC3, 0x84, 0x41, 0x42, 0x43, 0xC3, 0x96);

    var f = fs.open(FILENAME_ENC, "w");
    this.add_cleanup(function () {
        f.close();
        fs.remove(FILENAME_ENC);
    });

    f.write(data);
    f.close();

    f = fs.open(FILENAME_ENC, "r");
    assert_equals(f.read(), data);

    var g = fs.open(FILENAME_ENC, "rb");
    this.add_cleanup(function () { g.close(); });
    assert_equals(g.read(), data_b);

}, "read/write UTF-8 text by default");

test(function () {
    var data   = "ピタゴラスイッチ";
    var data_b = String.fromCharCode(
        0x83, 0x73, 0x83, 0x5e, 0x83, 0x53, 0x83, 0x89,
        0x83, 0x58, 0x83, 0x43, 0x83, 0x62, 0x83, 0x60);

    var f = fs.open(FILENAME_ENC, { mode: "w", charset: "Shift_JIS" });
    this.add_cleanup(function () {
        f.close();
        fs.remove(FILENAME_ENC);
    });

    f.write(data);
    f.close();

    f = fs.open(FILENAME_ENC, { mode: "r", charset: "Shift_JIS" });
    assert_equals(f.read(), data);

    var g = fs.open(FILENAME_ENC, "rb");
    this.add_cleanup(function () { g.close(); });
    assert_equals(g.read(), data_b);

}, "read/write Shift-JIS text with options", {/* unsupported */expected_fail: true});

test(function () {
    var data = String.fromCharCode(0, 1, 2, 3, 4, 5);

    var f = fs.open(FILENAME_BIN, "wb");
    this.add_cleanup(function () {
        f.close();
        fs.remove(FILENAME_BIN);
    });

    f.write(data);
    f.close();

    f = fs.open(FILENAME_BIN, "rb");
    assert_equals(f.read(), data);

}, "read/write binary data");

test(function () {
    var data = String.fromCharCode(0, 1, 2, 3, 4, 5);

    fs.write(FILENAME_BIN, data, "b");
    this.add_cleanup(function () {
        fs.remove(FILENAME_BIN);
    });

    assert_equals(fs.read(FILENAME_BIN, "b"), data);

}, "read/write binary data (shortcuts)");
