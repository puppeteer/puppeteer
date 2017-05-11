var fs = require("fs");

exports.get = function get(format, quality) {
    var expect_file = fs.join(
        module.dirname, "test" + quality + "." + format);
    return fs.read(expect_file, "b");
};
