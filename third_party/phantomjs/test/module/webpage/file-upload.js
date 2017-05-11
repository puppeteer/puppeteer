//! unsupported

// Note: uses various files in module/webpage as things to be uploaded.
// Which files they are doesn't matter.

var page;
setup(function () {
    page = new WebPage();
    page.content =
        '<input type="file" id="file">\n' +
        '<input type="file" id="file2" multiple>\n' +
        '<input type="file" id="file3" multiple>' +
        '<input type="file" id="file4">';
    page.uploadFile("#file", "file-upload.js");
    page.uploadFile("#file2", "file-upload.js");
    page.uploadFile("#file3", ["file-upload.js", "object.js"]);
});

function test_one_elt(id, names) {
    var files = page.evaluate(function (id) {
        var elt = document.getElementById(id);
        var rv = [];
        for (var i = 0; i < elt.files.length; i++) {
            rv.push(elt.files[i].fileName);
        }
        return rv;
    }, id);
    assert_deep_equals(files, names);
}

generate_tests(test_one_elt, [
    ["single upload single file", "file", ["file-upload.js"]],
    ["multiple upload single file", "file2", ["file-upload.js"]],
    ["multiple upload multiple file", "file3", ["file-upload.js", "object.js"]],
], { expected_fail: true });

async_test(function () {
    page.onFilePicker = this.step_func(function (oldFile) {
        assert_equals(oldFile, "");
        return "no-plugin.js";
    });

    test_one_elt("file4", []);

    page.evaluate(function () {
        var fileUp = document.querySelector("#file4");
        var ev = document.createEvent("MouseEvents");
        ev.initEvent("click", true, true);
        fileUp.dispatchEvent(ev);
    });

    setTimeout(this.step_func_done(function () {
        test_one_elt("file4", ["no-plugin.js"]);
    }, 0));

}, "page.onFilePicker", { expected_fail: true });
