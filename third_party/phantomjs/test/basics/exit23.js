//! no-harness
//! expect-exit: 23
//! expect-stdout: "we are alive"

var sys = require('system');
sys.stdout.write("we are alive\n");
phantom.exit(23);
sys.stdout.write("ERROR control passed beyond phantom.exit");
