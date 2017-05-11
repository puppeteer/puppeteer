test(function () {
    assert_no_property(window, "WebServer",
                       "WebServer constructor should not be global");

    var WebServer = require("webserver").create;
    assert_type_of(WebServer, "function");

}, "WebServer constructor");

test(function () {
    var server = require("webserver").create();

    assert_not_equals(server, null);
    assert_type_of(server, "object");
    assert_equals(server.objectName, "WebServer");

    assert_own_property(server, "port");
    assert_type_of(server.port, "string");
    assert_equals(server.port, "");

    assert_type_of(server.listenOnPort, "function");
    assert_type_of(server.newRequest, "function");
    assert_type_of(server.close, "function");

}, "WebServer object properties");
