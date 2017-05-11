//! stdin: Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich
//! stdin: いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす

//^ first line: pangram in German
//^ second line: pan+isogram in hiragana (the Iroha)

var stdin;
setup(function () { stdin = require("system").stdin; });

test(function () {
    assert_equals(stdin.readLine(),
        "Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich");
}, "input line one (German)");

test(function () {
    assert_equals(stdin.readLine(),
        "いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす");
}, "input line two (Japanese)");

test(function () {
    assert_equals(stdin.readLine(), "");
}, "input line three (EOF)");
