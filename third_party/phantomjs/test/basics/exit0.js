//! no-harness
//! expect-exit: 0
//! expect-stdout: "we are alive"

var sys = require('system');
sys.stdout.write("we are alive\n");
phantom.exit();
sys.stdout.write("ERROR control passed beyond phantom.exit");
