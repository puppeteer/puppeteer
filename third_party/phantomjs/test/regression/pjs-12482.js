//! no-harness

// https://github.com/ariya/phantomjs/issues/12482
// regression caused by fix for
// https://github.com/ariya/phantomjs/issues/12431

var webpage = require('webpage');
var sys = require('system');

var pages = [
    webpage.create(),
    webpage.create(),
    webpage.create()
];

var loaded = 0;

sys.stdout.write("1.." + pages.length + "\n");
setTimeout(function () { phantom.exit(1); }, 200);

function loadHook (status) {
    loaded++;
    if (status === "success") {
        sys.stdout.write("ok " + loaded + " loading page\n");
    } else {
        sys.stdout.write("not ok " + loaded + " loading page\n");
    }

    if (loaded === pages.length) {
        pages[1].close();
        setTimeout(function(){
            phantom.exit(0);
            sys.stdout.write("not ok " + (pages.length+1) +
                             " should not get here # TODO\n");
        }, 50);
    }
}
function consoleHook (msg) {
    sys.stdout.write(msg + "\n");
}

for (var i = 0; i < pages.length; i++) {
    pages[i].onConsoleMessage = consoleHook;
    pages[i].open(
        "data:text/html,<script>setTimeout(function(){console.log("+
        "'not ok "+(i+pages.length+2)+" page survived');},100)</script>",
        loadHook);
}
